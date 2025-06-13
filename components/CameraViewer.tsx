import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Text, ActivityIndicator } from 'react-native';
import { CameraView, Camera, CameraCapturedPicture } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CameraType = 'front' | 'back';
type FlashMode = 'on' | 'off';

const { width } = Dimensions.get('window');

export interface CameraViewerRef {
  takePicture: (options?: { quality?: number; base64?: boolean; exif?: boolean }) => Promise<CameraCapturedPicture>;
}

interface CameraViewerProps {
  onBarcodeScanned?: (data: { data: string }) => void;
  onTakePicture?: () => void;
  onFlashToggle?: (flashMode: 'on' | 'off') => void;
  onCameraToggle?: (cameraType: 'front' | 'back') => void;
  isScanning?: boolean;
  flashMode?: 'on' | 'off';
  cameraType?: 'front' | 'back';
  barcodeTypes?: string[];
  overlayText?: string;
  showViewfinder?: boolean;
  showControls?: boolean;
}

export const CameraViewer = forwardRef<CameraViewerRef, CameraViewerProps>(({
  onBarcodeScanned,
  onTakePicture,
  onFlashToggle,
  onCameraToggle,
  isScanning = false,
  flashMode = 'off',
  cameraType = 'back',
  barcodeTypes = ['ean13', 'upc_a', 'upc_e', 'qr', 'pdf417'],
  overlayText = 'Position in frame',
  showViewfinder = true,
  showControls = true,
}, ref) => {
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useImperativeHandle(ref, () => ({
    takePicture: async (options = {}) => {
      if (!cameraRef.current) {
        throw new Error('Camera reference not found');
      }
      return cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false,
        ...options
      });
    }
  }));

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleFlashToggle = () => {
    const newFlashMode = flashMode === 'on' ? 'off' : 'on';
    onFlashToggle?.(newFlashMode);
  };

  const handleCameraToggle = () => {
    const newCameraType = cameraType === 'back' ? 'front' : 'back';
    onCameraToggle?.(newCameraType);
  };

  const handleTakePicture = async () => {
    if (onTakePicture) {
      onTakePicture();
    } else if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
          exif: false,
        });
        return photo;
      } catch (error) {
        console.error('Error taking picture:', error);
        throw error;
      }
    }
  };

  const handleCameraReady = () => {
    setCameraReady(true);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialIcons name="camera" size={48} color="#666" />
        <MaterialIcons name="hourglass-empty" size={24} color="#666" style={styles.loadingIcon} />
      </View>
    );
  }


  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialIcons name="no-photography" size={48} color="#666" />
        <MaterialIcons name="error" size={24} color="#FF3B30" style={styles.errorIcon} />
      </View>
    );
  }

  const flashModeForCamera = flashMode === 'on' ? 'torch' : 'off' as const;

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        onBarcodeScanned={isScanning ? undefined : onBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: barcodeTypes as any[],
        }}
        style={styles.camera}
        facing={cameraType}
        flash={flashModeForCamera as any}
        onCameraReady={handleCameraReady}
      />

      <View style={styles.overlay}>
        {showViewfinder && (
          <View style={[styles.topOverlay, { paddingTop: insets.top + 20 }]}>
            <Text style={styles.overlayText}>{overlayText}</Text>
          </View>
        )}

        {showViewfinder && (
          <View style={styles.middleOverlay}>
            <View style={styles.viewfinder}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
          </View>
        )}

        {showControls && (
          <View style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleFlashToggle}
                disabled={!cameraReady}
              >
                <MaterialIcons
                  name={flashMode === 'on' ? 'flash-on' : 'flash-off'}
                  size={28}
                  color="white"
                />
              </TouchableOpacity>

              {onTakePicture && (
                <TouchableOpacity
                  style={[styles.captureButton, isScanning && styles.captureButtonDisabled]}
                  onPress={handleTakePicture}
                  disabled={isScanning || !cameraReady}
                >
                  {isScanning ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <MaterialIcons name="camera-alt" size={32} color="white" />
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleCameraToggle}
                disabled={!cameraReady}
              >
                <MaterialIcons name="flip-camera-ios" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingIcon: {
    marginTop: 10,
  },
  errorIcon: {
    marginTop: 10,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  topOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 8,
  },
  middleOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: width * 0.7,
    height: width * 0.5,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 40,
    height: 40,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: '#007AFF',
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 40,
    height: 40,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: '#007AFF',
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 40,
    height: 40,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#007AFF',
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 40,
    height: 40,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#007AFF',
    borderBottomRightRadius: 8,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
});
