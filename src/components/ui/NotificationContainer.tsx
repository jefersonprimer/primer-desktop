import { useNotification } from '../../contexts/NotificationContext';
import NotificationToast from './NotificationToast';

export default function NotificationContainer() {
  const { notifications } = useNotification();

  return (
    <div 
      className="fixed top-4 right-4 z-[100000] flex flex-col gap-3 w-full max-w-sm pointer-events-none"
      aria-live="polite"
    >
      {notifications.map((notification) => (
        <NotificationToast key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
