// Instead of importing from bundle.js, use the global variable:
const { AuthFetch, WalletClient } = window.bsv

document.getElementById('fetch-weather-button').addEventListener('click', async () => {
  try {
    // Create the wallet client and AuthFetch instance.
    const wallet = new WalletClient('json-api', 'localhost')
    const client = new AuthFetch(wallet)

    // Fetch weather stats using AuthFetch.
    const response = await client.fetch('http://localhost:3000/weatherStats', {
      method: 'GET'
    })
    const data = await response.json()
    console.log('Result:', data)

    // Update the UI with the weather data.
    document.getElementById('weather-data').innerHTML = JSON.stringify(data)
  } catch (error) {
    console.error('[ERROR] Failed to retrieve weather data:', error)
  }
})
