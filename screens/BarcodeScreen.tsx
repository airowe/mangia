import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useEffect, useRef, useState } from 'react';
import { View, Text, Button } from 'react-native';

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: any) => {
    setScanned(true);
    console.log('Scanned barcode: ', data);
    // Call UPC API or populate known product
  };

  if (!hasPermission) return <Text>No camera access</Text>;

  return (
    <BarCodeScanner
      onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
      style={{ flex: 1 }}
    />
  );
}
