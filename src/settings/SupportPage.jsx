import React, { useState, useEffect } from 'react';
import PageLayout from '../common/components/PageLayout';
import { useSelector } from 'react-redux';

const SupportPage = () => {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const currentUser = useSelector((state) => state.session.user);

  useEffect(() => {
    setIframeLoaded(false); // Yükleme işlemi başlamadan set edelim
  }, []);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  // Karakter kaydırma işlevi
  const shiftText = (text, shift) => {
    return text
      .split('')
      .map(char => String.fromCharCode(char.charCodeAt(0) + shift))
      .join('');
  };

  // Base64 encode işlemi (Türkçe karakter desteği için UTF-8 kodlama kullanıyoruz)
  const customEncrypt = (data, shift) => {
    const shifted = shiftText(data, shift);

    // UTF-8 encoding işlemi
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(shifted); // UTF-8 encoding

    // Base64'e dönüştürme
    let binary = '';
    encodedText.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary); // Base64 kodlama
  };

  // Kullanıcı bilgilerini düz metin olarak birleştir
  const userDataString = `name==${currentUser.name};;email==${currentUser.email};;phone==${currentUser.phone};;key==xxxxxxxx`;

  // Şifreleme işlemi (3 karakter kaydırma)
  const encryptedData = customEncrypt(userDataString, 3);

  // Şifrelenmiş veriyi URL ile gönder
  const iframeUrl = `https://takipon.com/appcontact?data=${encodeURIComponent(encryptedData)}`;

  return (
    <PageLayout breadcrumbs={['support', 'support']}>
      <iframe
        src={iframeUrl}
        width="100%"
        height="100%"
        style={{ border: 'none', display: iframeLoaded ? 'block' : 'none' }}
        title="Destek"
        onLoad={handleIframeLoad}
      />
      {!iframeLoaded && (
        <div className="iframe-loading-message">
          Bağlanıyor, lütfen bekleyiniz...
        </div>
      )}
      <style>{`
        .iframe-loading-message {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 18px;
          color: #333;
        }
      `}</style>
    </PageLayout>
  );
};

export default SupportPage;
