export function streamResponse(content: string, onChunk: (text: string) => void) {
  let index = 0;
  const words = content.split(' ');
  
  const timer = setInterval(() => {
    if (index >= words.length) {
      clearInterval(timer);
      return;
    }
    
    // Send words incrementally to simulate active streaming
    const chunk = (index === 0 ? '' : ' ') + words[index];
    onChunk(chunk);
    index++;
  }, 35);
  
  return () => clearInterval(timer);
}
