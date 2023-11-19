// Remote tmp
await Deno.remove('./tmp/audio', { recursive: true })

// Remove gen audio that is not in language file
