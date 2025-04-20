// import db from "../db/connection.js"
import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import util from 'util';
import playSound from 'play-sound';
import path from 'path';
import { fileURLToPath } from 'url';
import { decrypt_key } from '../app.js';

const speechService = {
  returnspeech: async (body) => {
    try {
      const rawKey = decrypt_key();
      const fixedKey = rawKey.replace(/\n/g, '\\n');
      const credentials = JSON.parse(fixedKey);
      const client = new textToSpeech.TextToSpeechClient({
        credentials
      });
      const request = {
        input: { text: body.imgtext },
        voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
      };
      const response = await client.synthesizeSpeech(request);
      const writeFile = util.promisify(fs.writeFile);
      const file_name_new = 'output_'+Date.now();
      await writeFile(file_name_new+'.mp3', response[0]['audioContent'], 'binary');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const filePath = path.join(__dirname,'..', '..', `${file_name_new}.mp3`);
      const player = playSound({});
      await player.play(filePath, (err) => {
        if (err) console.error('Error playing audio:', err,err.message);
      });
      return file_name_new;
    } catch (err) {
        console.error("Connection error:", err.message);
        return { success: false, message: err.message };
      }
  },

};
export default speechService;