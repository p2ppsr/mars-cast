import express, { Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import { Setup } from '@bsv/wallet-toolbox'
import { createPaymentMiddleware } from '@bsv/payment-express-middleware'
import { AuthRequest, createAuthMiddleware } from '@bsv/auth-express-middleware'

import * as crypto from 'crypto'
import { PubKeyHex, VerifiableCertificate } from '@bsv/sdk'
(global.self as any) = { crypto }

// NOTE: ONLY FOR DEMO, USE .ENV TO SECURE PROD ENVIRONMENT VARIABLES! ---------------------------------------------
const SERVER_PRIVATE_KEY = 'f9b0f65b26f7adfc70d3819491b42506c07d8f150c55a1eb31efe3b4997edba3'
const WALLET_STORAGE_URL = 'https://storage.babbage.systems'
const HTTP_PORT = 3000
const COOL_CERT_TYPE = 'AGfk/WrT1eBDXpz3mcw386Zww2HmqcIn3uY6x4Af1eo='

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
    // Ensure we have an array for the senderPublicKey, then push new certificates.
    if (!CERTIFICATES_RECEIVED[senderPublicKey]) {
      CERTIFICATES_RECEIVED[senderPublicKey] = [];
    }
    CERTIFICATES_RECEIVED[senderPublicKey].push(...certs);
    // You may call next() if you want to continue processing.
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

// Define the /weatherStats endpoint.
app.get('/weatherStats', async (req: AuthRequest, res: Response) => {
  const identityKey = req.auth?.identityKey || '';
  const certs = CERTIFICATES_RECEIVED[identityKey];
  console.log(certs)
  // If there is at least one certificate with the COOL_CERT_TYPE, proceed.
  if (certs && certs.some(cert => cert.type === COOL_CERT_TYPE)) {
    try {
      const responseData = await fetch(
        'https://api.nasa.gov/insight_weather/?api_key=DEMO_KEY&feedtype=json&ver=1.0',
        { method: 'GET' }
      ).then((response) => response.json());
      res.json(responseData);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      res.status(500).json({
        status: 'error',
        description: 'Error fetching weather data'
      });
    }

  }

  // Otherwise, return an error response.
  res.status(400).json({
    status: 'error',
    description: 'You are not cool enough!'
  });
  return
});


// Start the server.
app.listen(HTTP_PORT, () => {
  console.log('Monetized Weather API Wrapper listening on port', HTTP_PORT)
})
