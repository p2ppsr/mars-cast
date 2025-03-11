import express, { Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import { Setup } from '@bsv/wallet-toolbox'
import { createPaymentMiddleware } from '@bsv/payment-express-middleware'
import { AuthRequest, createAuthMiddleware } from '@bsv/auth-express-middleware'
import * as crypto from 'crypto'
import { PubKeyHex, VerifiableCertificate } from '@bsv/sdk'
(global.self as any) = { crypto }

const {
  SERVER_PRIVATE_KEY = 'f9b0f65b26f7adfc70d3819491b42506c07d8f150c55a1eb31efe3b4997edba3',
  WALLET_STORAGE_URL = 'https://storage.babbage.systems',
  HTTP_PORT = 3000,
  COOL_CERT_TYPE = 'AGfk/WrT1eBDXpz3mcw386Zww2HmqcIn3uY6x4Af1eo='
} = process.env
const CERTIFICATES_RECEIVED: Record<PubKeyHex, VerifiableCertificate[]> = {};

const app = express()
app.use(bodyParser.json({ limit: '64mb' }))

// This middleware sets CORS headers.
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Access-Control-Expose-Headers', '*')
  res.header('Access-Control-Allow-Private-Network', 'true')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Serve static files from the 'public' directory.
app.use(express.static('public'))

// -----------------------------------------------------------------------------
// MOCKED MARS WEATHER DATA WITH CACHING
// -----------------------------------------------------------------------------

interface MarsWeatherData {
  sol: number;
  date: string;
  temperature: {
    avg: number;
    min: number;
    max: number;
  };
  pressure: {
    value: number;
    unit: string;
  };
  wind: {
    speed: number;
    direction: string;
  };
  atmosphere: string;
  sunrise: string;
  sunset: string;
  uvIndex: number;
  season: string;
  lastUpdated: string;
}

// Cache variables to ensure data remains constant for a time period.
let cachedWeather: MarsWeatherData | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

function getCachedMarsWeatherData(): MarsWeatherData {
  const now = Date.now();
  if (cachedWeather && now - lastCacheTime < CACHE_DURATION) {
    return cachedWeather;
  }
  cachedWeather = mockMarsWeatherData();
  lastCacheTime = now;
  return cachedWeather;
}

function mockMarsWeatherData(): MarsWeatherData {
  return {
    sol: 1200 + Math.floor(Math.random() * 100),
    date: new Date().toISOString(),
    temperature: {
      avg: -60 + Math.random() * 20,
      min: -80 + Math.random() * 10,
      max: -50 + Math.random() * 20
    },
    pressure: {
      value: 700 + Math.random() * 100,
      unit: "Pa"
    },
    wind: {
      speed: Math.random() * 10,
      direction: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.floor(Math.random() * 8)]
    },
    atmosphere: ["Clear", "Dusty", "Dust Storm", "Cloudy"][Math.floor(Math.random() * 4)],
    sunrise: "05:34",
    sunset: "17:42",
    uvIndex: Math.floor(Math.random() * 10),
    season: ["Winter", "Spring", "Summer", "Fall"][Math.floor(Math.random() * 4)],
    lastUpdated: new Date().toISOString()
  };
}

// -----------------------------------------------------------------------------
// Wallet and Middleware Setup
// -----------------------------------------------------------------------------

const wallet = await Setup.createWalletClientNoEnv({
  chain: 'main',
  rootKeyHex: SERVER_PRIVATE_KEY,
  storageUrl: WALLET_STORAGE_URL
})

// Setup the authentication middleware.
app.use(createAuthMiddleware({
  wallet,
  allowUnauthenticated: false,
  // logger: console,
  // logLevel: 'debug',
  certificatesToRequest: {
    certifiers: ['0220529dc803041a83f4357864a09c717daa24397cf2f3fc3a5745ae08d30924fd'],
    types: {
      [COOL_CERT_TYPE]: ['cool']
    }
  },
  // Save certificates correctly when received.
  onCertificatesReceived: (
    senderPublicKey: string,
    certs: VerifiableCertificate[],
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    console.log('CERTS RECEIVED', certs);
    if (!CERTIFICATES_RECEIVED[senderPublicKey]) {
      CERTIFICATES_RECEIVED[senderPublicKey] = [];
    }
    CERTIFICATES_RECEIVED[senderPublicKey].push(...certs);
    // next();
  }
}))

// Setup the payment middleware.
app.use(createPaymentMiddleware({
  wallet,
  calculateRequestPrice: async (req) => {
    return 1 // 1 sat flat rate fee
  }
}))

// -----------------------------------------------------------------------------
// /weatherStats Endpoint - Returns Mocked Mars Weather Data
// -----------------------------------------------------------------------------

app.get('/weatherStats', async (req: AuthRequest, res: Response) => {
  const identityKey = req.auth?.identityKey || '';
  const certs = CERTIFICATES_RECEIVED[identityKey];
  console.log('Certificates for requester:', certs);

  if (certs && certs.some(cert => cert.type === COOL_CERT_TYPE)) {
    // Return the mocked Mars weather data (cached for 10 minutes)
    const weatherData = getCachedMarsWeatherData()
    res.json(weatherData)
    return
  }

  res.status(400).json({
    status: 'error',
    description: 'You are not cool enough!'
  });
});

// Start the server.
app.listen(HTTP_PORT, () => {
  console.log('Monetized Weather API Wrapper listening on port', HTTP_PORT)
})
