import { useCallback, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Demo from './demo2'
import Demo1 from './demo'
import Demo3 from './demo3'

function App() {
  const [count, setCount] = useState(0);

  const handleBack = useCallback((e: any) => {
    const event = new CustomEvent('back_three', {
      bubbles: true,
    });
    // event.initEvent("back_three", true, true);
    document.dispatchEvent(event);
    // e.target.dispatchEvent(event);
    console.log("trigger event", event);
  }, []);

  return (
    <>
       <div>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          background: "red",
          zIndex: 100,
        }}>
          <span onClick={handleBack}>back</span>
        </div>
       
       </div>
       <Demo3 />
    </>
  )
}

export default App
