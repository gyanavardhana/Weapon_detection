import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as tmImage from '@teachablemachine/image';

const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/qs1fABGIU/';

export default function TeachableModel() {
  const webcamRef = useRef(null);
  const [model, setModel] = useState(null);
  const [label, setLabel] = useState('');
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      const modelURL = MODEL_URL + 'model.json';
      const metadataURL = MODEL_URL + 'metadata.json';
      const loadedModel = await tmImage.load(modelURL, metadataURL);
      setModel(loadedModel);
      setIsModelLoaded(true);
    };
    loadModel();
  }, []);

  const captureAndPredict = async () => {
    if (model && webcamRef.current && webcamRef.current.video) {
      const prediction = await model.predict(webcamRef.current.video);
      const topPrediction = prediction.reduce((max, curr) =>
        curr.probability > max.probability ? curr : max
      );
      setLabel(`${topPrediction.className} (${(topPrediction.probability * 100).toFixed(1)}%)`);
    }
  };

  useEffect(() => {
    if (isModelLoaded) {
      const interval = setInterval(captureAndPredict, 1000);
      return () => clearInterval(interval);
    }
  }, [isModelLoaded]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Live Teachable Model Prediction</h1>

      <div className="w-full max-w-md rounded overflow-hidden shadow-lg bg-white">
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored
          screenshotFormat="image/jpeg"
          className="w-full h-auto rounded"
        />
        <div className="p-4 text-center">
          <p className="text-lg font-semibold">{label || 'Predicting...'}</p>
        </div>
      </div>
    </div>
  );
}
