use tauri::{AppHandle, Runtime, Emitter};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use std::sync::atomic::{AtomicBool, Ordering};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use log::{info, error};

// Simple global state for recording control (in a real app, manage via AppState)
lazy_static::lazy_static! {
    static ref IS_RECORDING: Arc<AtomicBool> = Arc::new(AtomicBool::new(false));
}

#[tauri::command]
pub async fn get_recording_status() -> Result<bool, String> {
    Ok(IS_RECORDING.load(Ordering::SeqCst))
}

#[tauri::command]
pub async fn start_recording<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    if IS_RECORDING.load(Ordering::SeqCst) {
        return Err("Already recording".to_string());
    }

    IS_RECORDING.store(true, Ordering::SeqCst);
    let is_recording = IS_RECORDING.clone();
    let app_handle = app.clone();

    // Spawn a thread to handle recording
    thread::spawn(move || {
        let host = cpal::default_host();
        let device = match host.default_input_device() {
            Some(d) => d,
            None => {
                error!("[Audio] No input device available");
                is_recording.store(false, Ordering::SeqCst);
                let _ = app_handle.emit("recording_error", "No input device available");
                return;
            }
        };

        let config = match device.default_input_config() {
            Ok(c) => c,
            Err(e) => {
                error!("[Audio] Failed to get default input config: {:?}", e);
                is_recording.store(false, Ordering::SeqCst);
                let _ = app_handle.emit("recording_error", format!("Config error: {:?}", e));
                return;
            }
        };

        // We'll use WAV format: 16-bit, mono or stereo depending on config.
        let spec = hound::WavSpec {
            channels: config.channels(),
            sample_rate: config.sample_rate().0,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };

        let temp_dir = std::env::temp_dir();
        let file_path = temp_dir.join("primer_recording.wav");
        
        info!("[Audio] Recording to {:?}", file_path);

        let writer = match hound::WavWriter::create(&file_path, spec) {
            Ok(w) => Arc::new(Mutex::new(Some(w))),
            Err(e) => {
                error!("[Audio] Failed to create WAV writer: {:?}", e);
                is_recording.store(false, Ordering::SeqCst);
                return;
            }
        };

        let writer_clone = writer.clone();
        
        // VAD Variables
        let silence_start = Arc::new(Mutex::new(None::<Instant>));
        let silence_threshold = 0.015; // Adjustable threshold (0.0 to 1.0)
        let silence_duration_limit = Duration::from_millis(1500); // 1.5 seconds silence triggers stop
        let speaking_started = Arc::new(AtomicBool::new(false)); // Don't stop before user starts talking

        let silence_start_clone = silence_start.clone();
        let speaking_started_clone = speaking_started.clone();
        let is_recording_clone_for_stream = is_recording.clone();
        let app_handle_clone = app_handle.clone();

        let err_fn = move |err| {
            error!("[Audio] A stream error occurred: {}", err);
        };

        let stream = match config.sample_format() {
            cpal::SampleFormat::F32 => device.build_input_stream(
                &config.into(),
                move |data: &[f32], _: &_| {
                    // Calculate RMS for VAD
                    let mut sum_squares = 0.0;
                    for &sample in data {
                        sum_squares += sample * sample;
                    }
                    let rms = (sum_squares / data.len() as f32).sqrt();
                    
                    // VAD Logic
                    if rms > silence_threshold {
                        // User is speaking
                        speaking_started_clone.store(true, Ordering::Relaxed);
                        let mut start = silence_start_clone.lock().unwrap();
                        *start = None;
                    } else if speaking_started_clone.load(Ordering::Relaxed) {
                        // Silence detected AFTER speech started
                        let mut start = silence_start_clone.lock().unwrap();
                        if start.is_none() {
                            *start = Some(Instant::now());
                        } else if let Some(s) = *start {
                            if s.elapsed() >= silence_duration_limit {
                                info!("[Audio] Silence detected, stopping recording automatically.");
                                is_recording_clone_for_stream.store(false, Ordering::SeqCst);
                                let _ = app_handle_clone.emit("recording_silence_detected", ());
                            }
                        }
                    }

                    // Write to file
                    if let Ok(mut guard) = writer_clone.lock() {
                         if let Some(writer) = guard.as_mut() {
                             for &sample in data {
                                 // Convert f32 to i16
                                 let s = (sample * i16::MAX as f32) as i16;
                                 writer.write_sample(s).ok();
                             }
                         }
                    }
                },
                err_fn,
                None 
            ),
            cpal::SampleFormat::I16 => device.build_input_stream(
                &config.into(),
                move |data: &[i16], _: &_| {
                    // Calculate RMS for VAD
                    let mut sum_squares = 0.0;
                    for &sample in data {
                         let normalized = sample as f32 / i16::MAX as f32;
                        sum_squares += normalized * normalized;
                    }
                    let rms = (sum_squares / data.len() as f32).sqrt();

                    // VAD Logic (Duplicated for simplicity due to types)
                     if rms > silence_threshold {
                        speaking_started_clone.store(true, Ordering::Relaxed);
                        let mut start = silence_start_clone.lock().unwrap();
                        *start = None;
                    } else if speaking_started_clone.load(Ordering::Relaxed) {
                        let mut start = silence_start_clone.lock().unwrap();
                        if start.is_none() {
                            *start = Some(Instant::now());
                        } else if let Some(s) = *start {
                            if s.elapsed() >= silence_duration_limit {
                                info!("[Audio] Silence detected (I16), stopping recording automatically.");
                                is_recording_clone_for_stream.store(false, Ordering::SeqCst);
                                let _ = app_handle_clone.emit("recording_silence_detected", ());
                            }
                        }
                    }

                    if let Ok(mut guard) = writer_clone.lock() {
                        if let Some(writer) = guard.as_mut() {
                            for &sample in data {
                                writer.write_sample(sample).ok();
                            }
                        }
                    }
                },
                err_fn,
                None
            ),
             // Ignoring U16 for VAD brevity, assuming most mics are F32 or I16. 
             // If needed, can implement similarly.
             _ => {
                // Fallback without VAD for other formats
                 device.build_input_stream(
                    &config.into(),
                    move |data: &[u16], _: &_| {
                         if let Ok(mut guard) = writer_clone.lock() {
                            if let Some(writer) = guard.as_mut() {
                                for &sample in data {
                                    writer.write_sample((sample as i16).wrapping_sub(i16::MAX)).ok();
                                }
                            }
                        }
                    },
                    move |err| error!("[Audio] Stream error: {}", err),
                    None
                )
            },
        };

        if let Ok(stream) = stream {
            if let Err(e) = stream.play() {
                 error!("[Audio] Failed to play stream: {:?}", e);
                 is_recording.store(false, Ordering::SeqCst);
                 return;
            }

            // Loop until stopped
            while is_recording.load(Ordering::SeqCst) {
                thread::sleep(Duration::from_millis(100));
            }
            
            // Drop stream to stop recording
            drop(stream);
        } else if let Err(e) = stream {
            error!("[Audio] Failed to build input stream: {:?}", e);
            is_recording.store(false, Ordering::SeqCst);
            return;
        }
        
        // Finalize writer
        if let Ok(mut guard) = writer.lock() {
            if let Some(w) = guard.take() {
                w.finalize().ok();
            }
        }
        
        info!("[Audio] Recording finished.");
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_recording() -> Result<String, String> {
    // If it's still recording, stop it.
    if IS_RECORDING.load(Ordering::SeqCst) {
        IS_RECORDING.store(false, Ordering::SeqCst);
        // Give a small buffer for the thread to flush and close file
        thread::sleep(Duration::from_millis(500));
    }

    let temp_dir = std::env::temp_dir();
    let file_path = temp_dir.join("primer_recording.wav");
    
    if !file_path.exists() {
        return Err("Recording file not found".to_string());
    }

    // Return the absolute path as a string
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn read_audio_file(path: String) -> Result<String, String> {
    use std::fs::File;
    use std::io::Read;
    use base64::{Engine as _, engine::general_purpose};

    let mut file = File::open(path).map_err(|e| e.to_string())?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

    Ok(general_purpose::STANDARD.encode(&buffer))
}
