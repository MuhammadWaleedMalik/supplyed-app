import { useEffect, useState } from 'react';
import { getProfileImage } from '../apis/profileImageApi';

export function useDashboardProfileImage() {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    let active = true;
    getProfileImage()
      .then(image => {
        if (active) setImageUrl(image.imageUrl || image.url || '');
      })
      .catch(() => {
        if (active) setImageUrl('');
      });
    return () => { active = false; };
  }, []);

  return imageUrl;
}
