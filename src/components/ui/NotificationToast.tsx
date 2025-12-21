import { useState } from 'react';
import { type Notification, useNotification } from '../../contexts/NotificationContext';
import CheckIcon from './icons/CheckIcon';
import CircleAlertIcon from './icons/CircleAlertIcon';
import CloseIcon from './icons/CloseIcon';

interface Props {
  notification: Notification;
}

export default function NotificationToast({ notification }: Props) {
  const { removeNotification } = useNotification();
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => removeNotification(notification.id), 300); // Wait for animation
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckIcon size={20} className="text-green-500" />;
      case 'error':
        return <CircleAlertIcon size={20} className="text-red-500" />;
      case 'warning':
        return <CircleAlertIcon size={20} className="text-yellow-500" />;
      case 'info':
      default:
        return <CircleAlertIcon size={20} className="text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success': return 'border-green-500/20';
      case 'error': return 'border-red-500/20';
      case 'warning': return 'border-yellow-500/20';
      case 'info': default: return 'border-blue-500/20';
    }
  };

  return (
    <div
      className={`
        pointer-events-auto
        flex w-full max-w-sm flex-col gap-2 rounded-lg border bg-neutral-900/95 p-4 shadow-xl backdrop-blur-sm
        transition-all duration-300 ease-in-out
        ${getBorderColor()}
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 space-y-1">
          {notification.title && (
            <h4 className="font-semibold text-sm text-neutral-100 leading-none">
              {notification.title}
            </h4>
          )}
          <p className="text-sm text-neutral-400 leading-relaxed">
            {notification.message}
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-md p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
        >
          <CloseIcon size={16} />
        </button>
      </div>

      {notification.actions && notification.actions.length > 0 && (
        <div className="flex justify-end gap-2 mt-1">
          {notification.actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                if (!notification.type || notification.type !== 'error') {
                   // Optional: auto dismiss on action? Usually yes for "Accept/Deny"
                   handleDismiss();
                }
              }}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                ${action.variant === 'primary' 
                  ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200' 
                  : action.variant === 'danger'
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}
              `}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
