import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as tmImage from '@teachablemachine/image';
import { Shield, AlertCircle, CheckCircle, Camera, Upload, ToggleLeft, ToggleRight } from 'lucide-react';

const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/qs1fABGIU/';

export default function WeaponDetectionSystem() {
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [model, setModel] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [useWebcam, setUseWebcam] = useState(true);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [lastDetectedClass, setLastDetectedClass] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const modelURL = MODEL_URL + 'model.json';
        const metadataURL = MODEL_URL + 'metadata.json';
        const loadedModel = await tmImage.load(modelURL, metadataURL);
        setModel(loadedModel);
        setIsModelLoaded(true);
      } catch (error) {
        console.error("Error loading model:", error);
      }
    };
    loadModel();
  }, []);

  const captureAndPredict = async () => {
    if (model && webcamRef.current && webcamRef.current.video && useWebcam) {
      setIsProcessing(true);
      try {
        const predictions = await model.predict(webcamRef.current.video);
        const topPrediction = predictions.reduce((max, curr) =>
          curr.probability > max.probability ? curr : max
        );
        
        setPrediction({
          className: topPrediction.className,
          probability: topPrediction.probability
        });
        
        // Only increment detection count when we detect a weapon that wasn't detected in the previous frame
        const isWeapon = topPrediction.className.toLowerCase().includes('weapon') && topPrediction.probability > 0.75;
        
        if (isWeapon && lastDetectedClass !== 'weapon') {
          setDetectionCount(prev => prev + 1);
          setLastDetectedClass('weapon');
        } else if (!isWeapon && lastDetectedClass === 'weapon') {
          setLastDetectedClass(null);
        }
      } catch (error) {
        console.error("Prediction error:", error);
      }
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          setUploadedImage(img);
          await predictFromImage(img);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const predictFromImage = async (imageElement) => {
    if (!model || !imageElement) return;
    
    setIsProcessing(true);
    try {
      const predictions = await model.predict(imageElement);
      const topPrediction = predictions.reduce((max, curr) =>
        curr.probability > max.probability ? curr : max
      );
      
      setPrediction({
        className: topPrediction.className,
        probability: topPrediction.probability
      });
      
      // For uploaded images, increment count only if it's a weapon
      const isWeapon = topPrediction.className.toLowerCase().includes('weapon') && topPrediction.probability > 0.75;
      if (isWeapon) {
        setDetectionCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Prediction error:", error);
    }
    setIsProcessing(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const toggleInputMode = () => {
    setUseWebcam(!useWebcam);
    // Reset prediction when switching modes
    setPrediction(null);
  };

  useEffect(() => {
    let interval;
    if (isModelLoaded && useWebcam) {
      interval = setInterval(captureAndPredict, 1000);
    }
    return () => clearInterval(interval);
  }, [isModelLoaded, useWebcam, lastDetectedClass]);

  const getStatusColor = () => {
    if (!prediction) return "bg-gray-100";
    if (prediction.className.toLowerCase().includes('weapon') && prediction.probability > 0.75) {
      return "bg-red-100 border-red-500";
    }
    return "bg-green-100 border-green-500";
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <Shield className="text-blue-600 mr-3" size={32} />
          <h1 className="text-3xl font-bold text-gray-800">Weapon Detection System</h1>
        </div>
        
        <div className="text-center mb-6">
          <p className="text-lg text-gray-600">
            AI and Deep Learning for Security Applications
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg shadow-md p-3 flex items-center">
            <span className={`mr-3 ${useWebcam ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
              Live Camera
            </span>
            <button 
              onClick={toggleInputMode}
              className="focus:outline-none" 
              aria-label="Toggle input mode"
            >
              {useWebcam ? 
                <ToggleRight size={32} className="text-blue-600" /> : 
                <ToggleLeft size={32} className="text-gray-400" />
              }
            </button>
            <span className={`ml-3 ${!useWebcam ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
              Image Upload
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Camera feed or image upload */}
          <div className="w-full md:w-2/3">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-800 text-white py-2 px-4 flex items-center justify-between">
                <div className="flex items-center">
                  {useWebcam ? (
                    <>
                      <Camera size={20} className="mr-2" />
                      <span>Live Camera Feed</span>
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="mr-2" />
                      <span>Image Analysis</span>
                    </>
                  )}
                </div>
                {!useWebcam && (
                  <button 
                    onClick={triggerFileInput} 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                  >
                    Upload Image
                  </button>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div className="relative">
                {useWebcam ? (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    mirrored
                    screenshotFormat="image/jpeg"
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="flex items-center justify-center bg-gray-100" style={{minHeight: "300px"}}>
                    {uploadedImage ? (
                      <img 
                        src={uploadedImage.src} 
                        alt="Uploaded for analysis" 
                        className="max-w-full max-h-96" 
                      />
                    ) : (
                      <div className="text-center p-6">
                        <Upload size={48} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500">Upload an image for weapon detection</p>
                      </div>
                    )}
                  </div>
                )}
                {isProcessing && (
                  <div className="absolute top-2 right-2">
                    <div className="animate-pulse bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                      Scanning
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status panel */}
          <div className="w-full md:w-1/3">
            <div className="bg-white rounded-lg shadow-lg h-full">
              <div className="bg-gray-800 text-white py-2 px-4">
                <span>Detection Status</span>
              </div>
              <div className="p-4">
                {!isModelLoaded ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-2"></div>
                      <p>Loading model...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`p-4 mb-4 rounded-lg border ${getStatusColor()}`}>
                      <div className="flex items-center mb-2">
                        {prediction && prediction.className.toLowerCase().includes('weapon') && prediction.probability > 0.75 ? (
                          <AlertCircle size={24} className="text-red-500 mr-2" />
                        ) : (
                          <CheckCircle size={24} className="text-green-500 mr-2" />
                        )}
                        <span className="font-bold">
                          {prediction ? prediction.className : 'Awaiting Input'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${prediction && prediction.className.toLowerCase().includes('weapon') ? 'bg-red-600' : 'bg-green-600'}`}
                          style={{ width: `${prediction ? prediction.probability * 100 : 0}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-sm mt-1">
                        {prediction ? `${(prediction.probability * 100).toFixed(1)}% confidence` : '0%'}
                      </div>
                    </div>

           
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This system is designed for security monitoring purposes only.</p>
          <p>Powered by AI & Deep Learning • For demonstration purposes</p>
        </div>
      </div>
    </div>
  );
}