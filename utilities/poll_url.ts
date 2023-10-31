export default function pollURL<T>(
  url: string,
  fetchOptions: RequestInit,
  pollingOptions: {
    retryLimit: number
    timeBetweenPolls: number
    predicate: (data: T) => boolean
  },
): Promise<T> {
  const {
    retryLimit,
    timeBetweenPolls,
    predicate,
  } = pollingOptions

  return new Promise<T>((resolve, reject) => {
    let attempts = 0

    function poll() {
      console.log(`Polling... (attempt ${attempts})`)
      fetch(url, fetchOptions)
        .then((response) => {
          if (response.ok) {
            return response.json() as Promise<T>
          } else {
            console.log(response)
            throw new Error('Network response was not ok')
          }
        })
        .then((data) => {
          console.log(data)
          if (predicate(data)) {
            // Desired response received, resolve the promise
            resolve(data)
          } else {
            // Continue polling after a delay if retry limit is not exceeded
            attempts++
            if (attempts < retryLimit) {
              setTimeout(poll, timeBetweenPolls)
            } else {
              // Retry limit exceeded, reject the promise
              reject(new Error('Retry limit exceeded'))
            }
          }
        })
        .catch((error) => {
          // Handle errors and continue polling after a delay if retry limit is not exceeded
          attempts++
          if (attempts < retryLimit) {
            setTimeout(poll, timeBetweenPolls)
          } else {
            // Retry limit exceeded, reject the promise
            reject(error)
          }
        })
    }

    // Start polling
    poll()
  })
}
