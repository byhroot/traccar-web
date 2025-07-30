import { useEffect } from 'react';
import svgRaw from '../../resources/images/TakiponLoader.svg?raw';

const Loader = () => {
  useEffect(() => {
    const loader = document.querySelector('.loader');
    if (loader) {
      loader.innerHTML = svgRaw; // SVG yerleştir
      loader.style.display = '';
    }
    return () => {
      if (loader) loader.style.display = 'none';
    };
  }, []);

  return null;
};

export default Loader;
