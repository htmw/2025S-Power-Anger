// import db from "../db/connection.js"
import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import util from 'util';

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: './src/speechjson.json' // Replace with the path to your JSON key file
});

const speechService = {
  returnspeech: async (body) => {
    try {
      // let time_stamp = Time();
      // const 
      const request = {
        input: { text: body.imgtext },
        voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
      };
      const response = await client.synthesizeSpeech(request);
      console.log('response',response[0]['audioContent']);
      const writeFile = util.promisify(fs.writeFile);
      const file_name_new = 'output_'+Date.now();
      console.log('file_name_new',file_name_new);
      await writeFile(file_name_new+'.mp3', response[0]['audioContent'], 'binary');
      return file_name_new;
    } catch (err) {
        console.error("Connection error:", err.message);
        return { success: false, message: err.message };
      }
  },

};
export default speechService;