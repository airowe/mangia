import * as React from 'react';
import { ViewStyle } from 'react-native';

declare module 'expo-camera' {
  export type CameraType = 'front' | 'back';
  export type FlashMode = 'on' | 'off' | 'auto' | 'torch';
  export type CameraFlashMode = FlashMode;
  export type CameraCapturedPicture = {
    width: number;
    height: number;
    uri: string;
    base64?: string;
    exif?: any;
  };

  export interface CameraProps {
    style?: ViewStyle;
    type?: CameraType;
    flashMode?: FlashMode;
    autoFocus?: boolean | string | number | undefined;
    zoom?: number;
    whiteBalance?: number | string;
    focusDepth?: number;
    ratio?: string;
    useCamera2Api?: boolean;
    barCodeScannerSettings?: object;
    onBarCodeScanned?: (scanResult: { type: string; data: string }) => void;
    onMountError?: (error: { message: string }) => void;
    onCameraReady?: () => void;
    onFacesDetected?: (faces: any) => void;
    faceDetectorSettings?: object;
    ref?: React.RefObject<any>;
    children?: React.ReactNode;
  }

  export const Camera: React.ForwardRefExoticComponent<CameraProps & React.RefAttributes<any>>;

  export function requestCameraPermissionsAsync(): Promise<{ status: string }>;
  export function getCameraPermissionsAsync(): Promise<{ status: string }>;
}
