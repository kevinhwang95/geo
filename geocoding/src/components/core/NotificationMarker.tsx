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

    // Enhanced marker styles based on priority
    const priorityStyles = {
      low: {
        color: '#10B981',
        gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        shadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
        size: 24,
        icon: '🟢'
      },
      medium: {
        color: '#F59E0B',
        gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        shadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
        size: 28,
        icon: '🟡'
      },
      high: {
        color: '#EF4444',
        gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        shadow: '0 6px 16px rgba(239, 68, 68, 0.5)',
        size: 32,
        icon: '🔴'
      }
    };

    const style = priorityStyles[notification.priority];
    const opacity = notification.is_read ? 0.6 : 1.0;

    // Create enhanced custom marker element
    const markerElement = document.createElement('div');
    markerElement.className = 'notification-marker';
    markerElement.style.cssText = `
      width: ${style.size}px;
      height: ${style.size}px;
      background: ${style.gradient};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: ${style.shadow}, 0 0 0 2px rgba(255, 255, 255, 0.3);
      cursor: pointer;
      position: relative;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: ${opacity};
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Add hover effect
    markerElement.addEventListener('mouseenter', () => {
      markerElement.style.transform = 'scale(1.1)';
      markerElement.style.boxShadow = `${style.shadow}, 0 0 0 4px rgba(255, 255, 255, 0.5)`;
    });

    markerElement.addEventListener('mouseleave', () => {
      markerElement.style.transform = 'scale(1)';
      markerElement.style.boxShadow = `${style.shadow}, 0 0 0 2px rgba(255, 255, 255, 0.3)`;
    });

    // Add enhanced priority indicator
    const priorityIndicator = document.createElement('div');
    priorityIndicator.style.cssText = `
      position: absolute;
      top: -4px;
      right: -4px;
      width: 16px;
      height: 16px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border: 2px solid ${style.color};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: ${style.color};
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      z-index: 1001;
    `;
    
    // Use priority-specific icons instead of letters
    const priorityIcons = {
      low: '✓',
      medium: '!',
      high: '⚠'
    };
    
    priorityIndicator.textContent = priorityIcons[notification.priority];
    markerElement.appendChild(priorityIndicator);

    // Add unread indicator for high priority
    if (notification.priority === 'high' && !notification.is_read) {
      const unreadIndicator = document.createElement('div');
      unreadIndicator.style.cssText = `
        position: absolute;
        top: -6px;
        left: -6px;
        width: 12px;
        height: 12px;
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(255, 107, 107, 0.6);
        z-index: 1002;
      `;
      markerElement.appendChild(unreadIndicator);
    }

    // Add enhanced animation styles
    const addAnimationStyles = () => {
      const styleSheet = document.createElement('style');
      styleSheet.setAttribute('data-notification-animations', 'true');
      styleSheet.textContent = `
        @keyframes notificationPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            box-shadow: ${style.shadow}, 0 0 0 2px rgba(255, 255, 255, 0.3);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
            box-shadow: ${style.shadow}, 0 0 0 4px rgba(255, 255, 255, 0.5);
          }
        }
        
        @keyframes notificationBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
            box-shadow: ${style.shadow}, 0 0 0 2px rgba(255, 255, 255, 0.3);
          }
          50% {
            transform: translateY(-6px) scale(1.08);
            box-shadow: ${style.shadow}, 0 0 0 6px rgba(255, 255, 255, 0.6);
          }
        }
        
        @keyframes notificationFlash {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            box-shadow: ${style.shadow}, 0 0 0 2px rgba(255, 255, 255, 0.3);
          }
          25% {
            opacity: 0.9;
            transform: scale(1.1);
            box-shadow: ${style.shadow}, 0 0 0 8px rgba(255, 255, 255, 0.8);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.15);
            box-shadow: ${style.shadow}, 0 0 0 12px rgba(255, 255, 255, 1);
          }
          75% {
            opacity: 0.9;
            transform: scale(1.1);
            box-shadow: ${style.shadow}, 0 0 0 8px rgba(255, 255, 255, 0.8);
          }
        }
        
        @keyframes notificationGlow {
          0%, 100% {
            box-shadow: ${style.shadow}, 0 0 0 2px rgba(255, 255, 255, 0.3);
          }
          50% {
            box-shadow: ${style.shadow}, 0 0 0 6px rgba(255, 255, 255, 0.6), 0 0 20px ${style.color}40;
          }
        }
      `;
      document.head.appendChild(styleSheet);
    };

    // Apply enhanced animations based on priority (only for unread notifications)
    if (!notification.is_read) {
      addAnimationStyles();
      
      switch (notification.priority) {
        case 'low':
          markerElement.style.animation = 'notificationPulse 3s infinite ease-in-out';
          break;
        case 'medium':
          markerElement.style.animation = 'notificationBounce 2s infinite ease-in-out';
          break;
        case 'high':
          markerElement.style.animation = 'notificationFlash 1s infinite ease-in-out';
          break;
      }
    } else {
      // For read notifications, add a subtle glow effect
      addAnimationStyles();
      markerElement.style.animation = 'notificationGlow 4s infinite ease-in-out';
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

    // Add enhanced info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 16px; max-width: 340px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12);">
          <div style="display: flex; align-items: center; margin-bottom: 12px; padding: 8px; background: linear-gradient(135deg, ${style.color}10, ${style.color}05); border-radius: 8px; border-left: 4px solid ${style.color};">
            <div style="width: 16px; height: 16px; background: ${style.gradient}; border-radius: 50%; margin-right: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.15);"></div>
            <div style="flex: 1;">
              <strong style="color: ${style.color}; text-transform: uppercase; font-size: 12px; font-weight: 700;">${notification.priority} Priority</strong>
              ${notification.is_read ? '<span style="margin-left: 8px; font-size: 10px; color: #666; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">READ</span>' : '<span style="margin-left: 8px; font-size: 10px; color: #ef4444; background: #fef2f2; padding: 2px 6px; border-radius: 4px; font-weight: 600;">UNREAD</span>'}
            </div>
          </div>
          <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937; font-weight: 700; line-height: 1.3;">${notification.title}</h4>
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">${notification.message}</p>
          <div style="background: #f9fafb; padding: 10px; border-radius: 8px; margin-bottom: 12px;">
            ${notification.land_name ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; font-weight: 500;">📍 <strong>Land:</strong> ${notification.land_name} (${notification.land_code})</p>` : ''}
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; font-weight: 500;">👤 <strong>Created by:</strong> ${getCreatorName()}</p>
            <p style="margin: 0; font-size: 12px; color: #6b7280; font-weight: 500;">🕒 <strong>Time:</strong> ${formatDateTime(notification.created_at)}</p>
          </div>
          ${getPhotosHTML()}
          <div style="display: flex; gap: 10px; margin-top: 16px;">
            <button id="dismiss-btn-${notification.id}" style="
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
              color: white; 
              border: none; 
              padding: 8px 16px; 
              border-radius: 8px; 
              font-size: 13px; 
              cursor: pointer;
              flex: 1;
              font-weight: 600;
              transition: all 0.2s ease;
              box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
            " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(239, 68, 68, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(239, 68, 68, 0.3)'">🗑️ Dismiss</button>
            <button id="mark-read-btn-${notification.id}" style="
              background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
              color: white; 
              border: none; 
              padding: 8px 16px; 
              border-radius: 8px; 
              font-size: 13px; 
              cursor: pointer;
              flex: 1;
              font-weight: 600;
              transition: all 0.2s ease;
              box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
            " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(16, 185, 129, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(16, 185, 129, 0.3)'">${notification.is_read ? '✅ Already Read' : '✓ Mark as Read'}</button>
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
        markerRef.current.map = null;
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
