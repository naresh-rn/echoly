const axios = require('axios');
const fs = require('fs');

async function test() {
  const ACCOUNT_ID = "9cc3aa4f56b78cf5dc73f75ae9dad32e";
  const API_TOKEN = "otOWH1C-L3iAWooopUY5nnfpMvnNXNsAIN7yuheO";

  try {
      const response = await axios({
          url: `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
          method: "POST",
          headers: {
              "Authorization": `Bearer ${API_TOKEN}`,
              "Content-Type": "application/json",
          },
          data: JSON.stringify({ prompt: "A beautiful landscape", num_steps: 20 }),
          responseType: 'arraybuffer',
      });
      console.log("Status:", response.status);
      console.log("Length:", response.data.length);
      fs.writeFileSync("test.png", response.data);
      console.log("Saved test.png. First 50 bytes:", response.data.slice(0, 50).toString('utf8'));
  } catch (error) {
      if (error.response && error.response.data) {
          console.error("Cloudflare API Error:", Buffer.from(error.response.data).toString());
      } else {
          console.error("Request Error:", error.message);
      }
  }
}

test();
