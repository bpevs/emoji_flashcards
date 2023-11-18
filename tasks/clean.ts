// Remote tmp
await Deno.remove('./data/tmp', { recursive: true })

// Remove gen audio that is not in language file
