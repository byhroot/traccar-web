import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from '@mui/material';

const DriverValue = ({ driverUniqueId }) => {
  const driver = useSelector((state) => state.drivers.items[driverUniqueId]);

  if (!driver) return driverUniqueId;

  const name = driver.name || driver.uniqueId;
  const rawTel = driver.attributes?.tel;

  if (rawTel) {
    // 🔹 1. Tüm gereksiz karakterleri temizle (boşluk, -, (, ), vb.)
    let tel = rawTel.replace(/[^\d]/g, '');

    // 🔹 2. Eğer başında birden fazla 0 varsa -> teke indir
    tel = tel.replace(/^0+/, '0');

    // 🔹 3. Eğer hiç 0 yoksa başa 0 ekle
    if (!tel.startsWith('0')) {
      tel = '0' + tel;
    }

    return React.createElement(
      Link,
      {
        href: `tel:${tel}`,
        underline: 'hover',
        sx: { color: 'inherit', cursor: 'pointer' },
      },
      `${name} - ${tel}`
    );
  }

  return name;
};

export default DriverValue;
