import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import { Platform } from 'react-native';

export type ScannedPage = { uri: string; width: number; height: number };

const PAGE_WIDTH_PX = 1600;

// Android's picker offers a free-form crop, which is handy for trimming a page edge to edge.
// iOS only offers a square crop, so there we keep the full photo.
export async function capturePage(): Promise<ScannedPage | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Camera access is off. Turn it on for Expo Go in your phone settings to scan documents.');
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: Platform.OS === 'android',
    quality: 1,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, width: asset.width, height: asset.height };
}

export async function pickPages(): Promise<ScannedPage[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: 20,
    quality: 1,
  });
  if (result.canceled) return [];
  return result.assets.map((asset) => ({ uri: asset.uri, width: asset.width, height: asset.height }));
}

async function toCompressedBase64(page: ScannedPage) {
  const context = ImageManipulator.manipulate(page.uri);
  if (page.width > PAGE_WIDTH_PX) context.resize({ width: PAGE_WIDTH_PX });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.65, format: SaveFormat.JPEG, base64: true });
  return saved.base64!;
}

// One A4 page per photo, scaled to fit, so the result opens like a normal scanned PDF on the web.
export async function buildPdf(pages: ScannedPage[]): Promise<ArrayBuffer> {
  const images = await Promise.all(pages.map(toCompressedBase64));
  const html = `
    <html>
      <head>
        <style>
          @page { size: A4; margin: 0; }
          body { margin: 0; }
          .page { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; page-break-after: always; }
          .page:last-child { page-break-after: auto; }
          img { max-width: 100%; max-height: 100%; object-fit: contain; }
        </style>
      </head>
      <body>
        ${images.map((data) => `<div class="page"><img src="data:image/jpeg;base64,${data}" /></div>`).join('')}
      </body>
    </html>`;

  // Ask for the PDF as base64 instead of reading the file back: Expo Go only grants read access to the
  // app's own sandbox, and expo-print writes outside it ("missing read permission").
  const { base64 } = await Print.printToFileAsync({ html, width: 595, height: 842, base64: true });
  if (!base64) throw new Error('Could not create the PDF. Please try again.');
  return base64ToArrayBuffer(base64);
}

function base64ToArrayBuffer(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function safeFileName(name: string) {
  const cleaned = name.trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-').slice(0, 80);
  return `${cleaned || 'scan'}.pdf`;
}
