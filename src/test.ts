// Instead of importing from bundle.js, use the global variable:
import { AuthFetch, WalletClient } from '@bsv/sdk'
import * as crypto from 'crypto'
(global.self as any) = { crypto };

(async () => {
  // Create the wallet client and AuthFetch instance.
  const wallet = new WalletClient('json-api', 'localhost')
  const client = new AuthFetch(wallet)

  // Fetch weather stats using AuthFetch.
  const response = await client.fetch('http://localhost:3000/weatherStats', {
    method: 'GET'
  })
  const data = await response.json()
  console.log('Result:', data)
})()
