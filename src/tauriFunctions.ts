import { invoke } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'

// Tauri commands exposed as async calls
export async function isFocused(): Promise<boolean> {
  return invoke<boolean>('is_focused')
}

export async function onFocusRequested(): Promise<void> {
  return invoke<void>('request_focus')
}

export async function onFocusRelinquished(): Promise<void> {
  return invoke<void>('relinquish_focus')
}

// Export a bundle of all Tauri functions to pass to the UI components
export const tauriFunctions = {
  isFocused,
  onFocusRequested,
  onFocusRelinquished,
  onDownloadFile: async (fileData: Blob, fileName: string): Promise<boolean> => {
    try {
      // Get file extension
      const fileExt = fileName.split('.').pop() || 'txt';
      
      // Use Tauri's save dialog to get the save path
      const savePath = await save({
        filters: [{
          name: `${fileExt.toUpperCase()} Files`,
          extensions: [fileExt]
        }, {
          name: 'All Files',
          extensions: ['*']
        }],
        defaultPath: fileName
      });
      
      // If user canceled the save dialog
      if (!savePath) {
        return false;
      }
      
      // Convert Blob to ArrayBuffer and then to Uint8Array
      const arrayBuffer = await fileData.arrayBuffer();
      const contents = Array.from(new Uint8Array(arrayBuffer));
      
      // Use our custom Rust command to save the file
      await invoke('save_file', { 
        path: savePath,
        contents: contents
      });
      
      console.log(`File saved to: ${savePath}`);
      return true;
    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  }
}
