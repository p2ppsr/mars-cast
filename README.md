# MarsCast - Monetized Mars Weather API 🚀

### Explore Martian Weather Data. Pay only for what you use. Powered by the BSV Blockchain and Identity Certificates.

MarsCast is the first-of-its-kind monetized API providing real-time weather data from Mars, uniquely combining micropayments and blockchain-based identity certificates for secure and verified access. Developers, educators, space enthusiasts, and businesses can seamlessly integrate reliable Martian climate data into their projects, paying securely and precisely for exactly what they consume.

## 🌌 Key Features

- **Real-Time Martian Weather**: Up-to-date atmospheric data directly from NASA's InSight Mars lander.
- **Micropayments**: Powered by blockchain, enabling microtransactions for each API call, ensuring you only pay for what you use.
- **Verified Access**: Users must hold an identity certificate with a verified `cool: true` attribute to access the API.
- **Scalable & Transparent**: Transparent billing, usage statistics, and identity verification through decentralized ledger technology.
- **Developer-Friendly**: Simple RESTful API integration with clear documentation and examples.

## 🚀 Quick Start

### Sample Usage

Integrate MarsCast API effortlessly into your apps:

```typescript
  const wallet = new WalletClient('json-api', 'localhost')
  // Fetch weather stats using AuthFetch
  const response = await new AuthFetch(wallet).fetch('http://api.marscast.space/weatherStats', {
    method: 'GET'
  })
```

### Micropayments & Identity Verification

Every request triggers:

- **Micropayment via BRC-100 Wallet**
- **Verification of `Cool` Identity Certificate** (BRC-52 compliant)
- **Selective field revelation**: only the required identity attributes are revealed, ensuring maximum user privacy.

---

**MarsCast** - Connecting Earthlings to Martian skies.

