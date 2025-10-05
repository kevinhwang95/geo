import React, { useEffect, useRef, useState } from 'react';
import PhotoCarouselModal from './PhotoCarouselModal';

interface NotificationMarkerProps {
  map: google.maps.Map | null;
  position: google.maps.LatLngLiteral;
  notification: {
    id: number;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    type: string;
    land_name?: string;
    land_code?: string;
    is_read: boolean;
    created_at: string;
    creator_first_name?: string;
    creator_last_name?: string;
    photos?: Array<{
      id: number;
      file_path: string;
      file_name: string;
      file_size: number;
      mime_type: string;
      uploaded_at: string;
    }>;
  };
  onClick?: () => void;
  onDismiss?: () => void;
}

const NotificationMarker: React.FC<NotificationMarkerProps> = ({
  map,
  position,
  notification,
  onClick,
  onDismiss
}) => {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Function to handle photo click
  const handlePhotoClick = (photoIndex: number) => {
    setSelectedPhotoIndex(photoIndex);
    setIsPhotoModalOpen(true);
  };

  useEffect(() => {
    if (!map) return;

    console.log('Creating notification marker:', notification);

    // Set marker styles based on priority
    const priorityColors = {
      low: '#10B981',    // Green
      medium: '#F59E0B', // Yellow
      high: '#EF4444'    // Red
    };

    const styles = {
      backgroundColor: priorityColors[notification.priority],
      borderColor: priorityColors[notification.priority],
      opacity: notification.is_read ? 0.7 : 1.0
    };
    const priorityLetter = notification.priority.charAt(0).toUpperCase();

    // Create custom marker element
    const markerElement = document.createElement('div');
    markerElement.className = 'notification-marker';
    markerElement.style.cssText = `
      width: 24px;
      height: 24px;
      background-color: ${styles.backgroundColor};
      border: 3px solid ${styles.borderColor};
      border-radius: 50%;
      box-shadow: 0 0 10px ${styles.backgroundColor}80;
      cursor: pointer;
      position: relative;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: ${styles.opacity};
    `;

    // Add priority indicator dot
    const priorityDot = document.createElement('div');
    priorityDot.style.cssText = `
      position: absolute;
      top: -2px;
      right: -2px;
      width: 10px;
      height: 10px;
      background-color: white;
      border: 2px solid ${styles.backgroundColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 7px;
      color: ${styles.backgroundColor};
      font-weight: bold;
    `;
    priorityDot.textContent = priorityLetter;
    markerElement.appendChild(priorityDot);

    // Add animation styles directly to the marker element
    const addAnimationStyles = () => {
      const styleSheet = document.createElement('style');
      styleSheet.setAttribute('data-notification-animations', 'true');
      styleSheet.textContent = `
        @keyframes notificationPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
        
        @keyframes notificationBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-8px) scale(1.05);
          }
        }
        
        @keyframes notificationFlash {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 0 15px ${styles.backgroundColor}60;
          }
          25% {
            opacity: 0.8;
            transform: scale(1.05);
            box-shadow: 0 0 25px ${styles.backgroundColor}90;
          }
          50% {
            opacity: 0.4;
            transform: scale(1.1);
            box-shadow: 0 0 30px ${styles.backgroundColor};
          }
          75% {
            opacity: 0.8;
            transform: scale(1.05);
            box-shadow: 0 0 25px ${styles.backgroundColor}90;
          }
        }
      `;
      document.head.appendChild(styleSheet);
    };

    // Apply the appropriate animation based on priority (only for unread notifications)
    if (!notification.is_read) {
      addAnimationStyles();
      
      switch (notification.priority) {
        case 'low':
          markerElement.style.animation = 'notificationPulse 2s infinite';
          break;
        case 'medium':
          markerElement.style.animation = 'notificationBounce 1s infinite';
          break;
        case 'high':
          markerElement.style.animation = 'notificationFlash 0.5s infinite';
          break;
      }
    }

    // Create AdvancedMarkerElement with the animated custom element
    const marker = new google.maps.marker.AdvancedMarkerElement({
      position,
      map,
      title: `${notification.title} - ${notification.priority} priority`,
      content: markerElement,
      zIndex: 1000
    });

    markerRef.current = marker;

    // Add click listener
    if (onClick) {
      marker.addListener('click', onClick);
    }

    // Format date and time
    const formatDateTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Format creator name
    const getCreatorName = () => {
      if (notification.creator_first_name && notification.creator_last_name) {
        return `${notification.creator_first_name} ${notification.creator_last_name}`;
      }
      return 'Unknown User';
    };

    // Generate photos HTML
    const getPhotosHTML = () => {
      if (!notification.photos || notification.photos.length === 0) {
        return '';
      }

      console.log('Photos for notification:', notification.photos);

      const photosHTML = notification.photos.map((photo, index) => {
        // Ensure proper URL construction - use server root for static files
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const serverRoot = apiBaseUrl.replace(/\/api$/, ''); // Remove /api to get server root
        const photoUrl = `${serverRoot}/${photo.file_path}`;
        
        console.log(`Photo ${index + 1} - API Base: ${apiBaseUrl}, Server Root: ${serverRoot}, Final URL: ${photoUrl}`);
        
        return `
          <div style="margin: 4px 0; text-align: center; padding: 3px; background-color: white; border-radius: 4px; border: 1px solid #e0e0e0;">
            <div style="position: relative; display: inline-block;">
              <img src="${photoUrl}" 
                   alt="${photo.file_name}"
                   style="width: 80px; height: 60px; border-radius: 4px; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.2); object-fit: cover; display: block;"
                   onclick="window.openPhotoCarousel(${index})"
                   onload="console.log('Photo loaded successfully:', '${photo.file_name}')"
                   onerror="console.error('Photo failed to load:', '${photoUrl}'); this.style.display='none'; this.nextElementSibling.style.display='block';">
            </div>
          </div>
        `;
      }).join('');

      return `
        <div style="margin: 10px 0; border-top: 1px solid #eee; padding-top: 10px;">
          <h5 style="margin: 0 0 6px 0; font-size: 12px; color: #333; font-weight: 600;">📸 Photos (${notification.photos.length})</h5>
          <div style="max-height: 150px; overflow-y: auto; border: 1px solid #f0f0f0; border-radius: 6px; padding: 6px; background-color: #fafafa;">
            <div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;">
              ${photosHTML}
            </div>
          </div>
        </div>
      `;
    };

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; max-width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <div style="width: 14px; height: 14px; background-color: ${styles.backgroundColor}; border-radius: 50%; margin-right: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
            <strong style="color: ${styles.backgroundColor}; text-transform: uppercase; font-size: 12px;">${notification.priority} Priority</strong>
            ${notification.is_read ? '<span style="margin-left: 8px; font-size: 10px; color: #666;">(READ)</span>' : ''}
          </div>
          <h4 style="margin: 0 0 6px 0; font-size: 15px; color: #333; font-weight: 600;">${notification.title}</h4>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #666; line-height: 1.4;">${notification.message}</p>
          ${notification.land_name ? `<p style="margin: 0 0 3px 0; font-size: 11px; color: #888;">📍 Land: ${notification.land_name} (${notification.land_code})</p>` : ''}
          <p style="margin: 0 0 3px 0; font-size: 11px; color: #888;">👤 Created by: ${getCreatorName()}</p>
          <p style="margin: 0 0 10px 0; font-size: 11px; color: #888;">🕒 ${formatDateTime(notification.created_at)}</p>
          ${getPhotosHTML()}
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button id="dismiss-btn-${notification.id}" style="
              background-color: #ef4444; 
              color: white; 
              border: none; 
              padding: 6px 12px; 
              border-radius: 6px; 
              font-size: 12px; 
              cursor: pointer;
              flex: 1;
              font-weight: 500;
              transition: background-color 0.2s;
            " onmouseover="this.style.backgroundColor='#dc2626'" onmouseout="this.style.backgroundColor='#ef4444'">Dismiss</button>
            <button id="mark-read-btn-${notification.id}" style="
              background-color: #10b981; 
              color: white; 
              border: none; 
              padding: 6px 12px; 
              border-radius: 6px; 
              font-size: 12px; 
              cursor: pointer;
              flex: 1;
              font-weight: 500;
              transition: background-color 0.2s;
            " onmouseover="this.style.backgroundColor='#059669'" onmouseout="this.style.backgroundColor='#10b981'">${notification.is_read ? 'Already Read' : 'Mark as Read'}</button>
          </div>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
      
      // Add global function for photo carousel
      (window as any).openPhotoCarousel = (photoIndex: number) => {
        handlePhotoClick(photoIndex);
      };
      
      // Add event listeners to buttons after info window opens
      setTimeout(() => {
        const dismissBtn = document.getElementById(`dismiss-btn-${notification.id}`);
        const markReadBtn = document.getElementById(`mark-read-btn-${notification.id}`);
        
        if (dismissBtn && onDismiss) {
          dismissBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Add fade-out animation before dismissing
            if (markerElement) {
              markerElement.style.transition = 'opacity 0.5s ease-out';
              markerElement.style.opacity = '0';
              setTimeout(() => {
                onDismiss();
                infoWindow.close();
              }, 500);
            } else {
              onDismiss();
              infoWindow.close();
            }
          });
        }
        
        if (markReadBtn && onClick && !notification.is_read) {
          markReadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Add fade-out animation before marking as read
            if (markerElement) {
              markerElement.style.transition = 'opacity 0.5s ease-out';
              markerElement.style.opacity = '0';
              setTimeout(() => {
                onClick();
                infoWindow.close();
              }, 500);
            } else {
              onClick();
              infoWindow.close();
            }
          });
        } else if (markReadBtn && notification.is_read) {
          // Disable the button for already read notifications
          markReadBtn.style.backgroundColor = '#9ca3af';
          markReadBtn.style.cursor = 'not-allowed';
        }
      }, 100);
    });

    // Cleanup function
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Remove the dynamically added style sheet
      const addedStyles = document.querySelectorAll('style[data-notification-animations]');
      addedStyles.forEach(style => style.remove());
    };
  }, [map, position, notification, onClick]);

  return (
    <>
      {notification.photos && notification.photos.length > 0 && (
        <PhotoCarouselModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          photos={notification.photos}
          initialIndex={selectedPhotoIndex}
        />
      )}
    </>
  );
};

export default NotificationMarker;
