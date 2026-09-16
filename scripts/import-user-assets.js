const fs = require('fs');
const path = require('path');

const srcLogo = 'C:/Users/lacem/.gemini/antigravity/brain/81fef4a6-a4c8-4daa-bdca-08549f7bde43/.user_uploaded/media_1789581760241.png';
const srcLaco = 'C:/Users/lacem/.gemini/antigravity/brain/81fef4a6-a4c8-4daa-bdca-08549f7bde43/.user_uploaded/media_1789581824674.png';

fs.mkdirSync('public', { recursive: true });
fs.copyFileSync(srcLogo, 'public/logo-semus-brasao.png');
fs.copyFileSync(srcLaco, 'public/laco-fibromialgia.png');

const bufLogo = fs.readFileSync(srcLogo);
const bufLaco = fs.readFileSync(srcLaco);

const base64Logo = 'data:image/png;base64,' + bufLogo.toString('base64');
const base64Laco = 'data:image/png;base64,' + bufLaco.toString('base64');

const content = 'export const LOGO_SEMUS_BRASAO_BASE64 = ' + JSON.stringify(base64Logo) + ';\n' +
                'export const LACO_FIBRO_BASE64 = ' + JSON.stringify(base64Laco) + ';\n' +
                'export const BRASAO_BASE64 = LOGO_SEMUS_BRASAO_BASE64;\n' +
                'export const LACO_BASE64 = LACO_FIBRO_BASE64;\n';

fs.writeFileSync('src/components/carteira/assets.ts', content);
console.log('Imagens copiadas e base64 gerado com sucesso!');
