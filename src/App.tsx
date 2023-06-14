import React from "react";
import { useState, useEffect, useRef } from "react";
import * as esbuild from "esbuild-wasm";
import { unpkgBuildPlugin } from "./plugins/unpkg-build-plugin";
import { unpkgLoadPlugin } from "./plugins/unpkg-load-plugin";

function App() {
  const service = useRef<esbuild.Service>();
  const iframe = useRef<any>();
  const [input, setInput] = useState("");
  //const [code, setCode] = useState("");

  useEffect(() => {
    intializeEsbundle();
  }, []);

  const intializeEsbundle = async () => {
    service.current = await esbuild.startService({
      worker: true,
      wasmURL: "https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm",
    });
  };

  const onChangeHandler = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async () => {
    if (!service.current) {
      return;
    }
    const result = await service.current.build({
      entryPoints: ["index.js"],
      bundle: true,
      write: false,
      plugins: [unpkgBuildPlugin(), unpkgLoadPlugin(input)],
      define: {
        "process.env.NODE_ENV": '"production"',
        global: "window",
      },
    });

    //setCode(result.outputFiles[0].text);
    iframe.current.contentWindow?.postMessage(result.outputFiles[0].text, '*');
  };

  const html = `
  <html>
    <head></head>
      <body>
        <div id = "root"></div>
        <script>
          window.addEventListener('message' , (code) => {
            try{
              eval(code.data);
            }
            catch(err){
              console.error(err);
            }
          });
        </script>
      </body>
  </html>`;

  return (
    <div>
      <div className="test">
        <textarea value={input} onChange={onChangeHandler} />
        <button onClick={handleSubmit}> Submit </button>
        <iframe
          ref={iframe}
          title="output"
          sandbox="allow-scripts"
          srcDoc={html}
        />
      </div>
    </div>
  );
}

export default App;
