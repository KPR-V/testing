import React, { useState } from "react";
import { CheckCircle, Clock } from "lucide-react";

const ExpatWallet = () => {
  const [steps, setSteps] = useState([
    {
      id: 1,
      title: "Obtain Employment Contract",
      vcs: [
        { id: 1, title: "Employment Offer Letter", obtainedFrom: "Employer" },
      ],
      completed: false,
    },
    {
      id: 2,
      title: "Apply for Visa",
      vcs: [
        {
          id: 2,
          title: "Proof of Identity",
          obtainedFrom: "Immigration Authority",
        },
        { id: 3, title: "Employment Contract", obtainedFrom: "Employer" },
        {
          id: 4,
          title: "Proof of Financial Stability",
          obtainedFrom: "Immigration Authority",
        },
      ],
      completed: false,
    },
    {
      id: 3,
      title: "Register with Municipality",
      vcs: [
        { id: 5, title: "Employment Contract", obtainedFrom: "Employer" },
        {
          id: 6,
          title: "Proof of Identity",
          obtainedFrom: "Immigration Authority",
        },
        { id: 7, title: "Birth Certificate", obtainedFrom: "Municipality" },
      ],
      completed: false,
    },
    {
      id: 4,
      title: "Open Bank Account",
      vcs: [
        { id: 8, title: "Proof of Registration", obtainedFrom: "Municipality" },
        { id: 9, title: "Employment Contract", obtainedFrom: "Employer" },
        {
          id: 10,
          title: "Proof of Identity",
          obtainedFrom: "Immigration Authority",
        },
      ],
      completed: false,
    },
    {
      id: 5,
      title: "Secure Housing and Sign Rental Agreement",
      vcs: [
        { id: 11, title: "Employment Contract", obtainedFrom: "Employer" },
        {
          id: 12,
          title: "Proof of Identity",
          obtainedFrom: "Immigration Authority",
        },
        { id: 13, title: "Bank Account Details", obtainedFrom: "Bank" },
      ],
      completed: false,
    },
  ]);

  const [completedTasks, setCompletedTasks] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);

  const updateVCStatus = (vcId, status) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) => ({
        ...step,
        vcs: step.vcs.map((vc) =>
          vc.id === vcId ? { ...vc, obtained: status } : vc
        ),
      }))
    );

    setCompletedTasks((prevCompletedTasks) => {
      const updatedTasks = status
        ? [...prevCompletedTasks, vcId]
        : prevCompletedTasks.filter((id) => id !== vcId);
      updateStepCompletion(updatedTasks);
      return updatedTasks;
    });
  };

  const updateStepCompletion = (completedVCs) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) => ({
        ...step,
        completed: step.vcs.every((vc) => completedVCs.includes(vc.id)),
      }))
    );
  };

  const toggleVC = (stepIndex, vcIndex) => {
    const vc = steps[stepIndex].vcs[vcIndex];
    updateVCStatus(vc.id, !completedTasks.includes(vc.id));
  };

  const obtainVC = (stepIndex, vcIndex) => {
    const vc = steps[stepIndex].vcs[vcIndex];
    updateVCStatus(vc.id, true);
  };

  const calculateProgress = () => {
    const totalSteps = steps.length;
    const completedSteps = steps.filter((step) => step.completed).length;
    return (completedSteps / totalSteps) * 100;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-500 to-gray-400">
      {/* Left Side: Progress & Steps */}
      <div className="w-1/2 p-8 animate-fade-in bg-gradient-to-br from-green-700 to-gray-500 shadow-lg rounded-lg m-4">
        <h2 className="text-3xl font-extrabold text-white mb-6">
          Miko's Journey
        </h2>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-300 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-green-400 to-blue-500 rounded-full h-4 transition-all duration-300 ease-in-out"
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
          <p className="text-sm text-white mt-2">
            {Math.round(calculateProgress())}% Complete
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex cursor-pointer items-center p-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:bg-gray-300 ${
                step.completed ? "bg-green-100" : "bg-gray-100"
              }`}
              onClick={() => setSelectedStep(step)}
            >
              <div className="flex items-center flex-1">
                {step.completed ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <Clock className="h-6 w-6 text-gray-400" />
                )}
                <span
                  className={`ml-4 text-lg font-semibold ${
                    step.completed
                      ? "line-through text-gray-500"
                      : "text-gray-700 "
                  }`}
                >
                  {step.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side: Verifiable Credentials */}
      <div className="w-1/2 p-6 bg-gradient-to-br from-green-700 to-gray-500 shadow-lg rounded-lg m-4">
        <h2 className="text-3xl font-extrabold text-white mb-6">
          Verifiable Credentials
        </h2>
        <div className="h-[calc(100vh-12rem)] overflow-y-auto pr-2 space-y-4 overflow-x-hidden">
          {selectedStep?.vcs.map((vc, index) => (
            <div
              key={vc.id}
              className={`p-4 rounded-lg shadow-md transition-colors duration-200 hover:bg-opacity-80 ${
                completedTasks.includes(vc.id)
                  ? "bg-gradient-to-r from-green-200 to-green-100"
                  : "bg-gradient-to-r from-gray-50 to-gray-100"
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-xl text-gray-700">
                  {vc.title}
                </h3>
                <div className="flex space-x-2 items-center">
                  {completedTasks.includes(vc.id) ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        obtainVC(
                          steps.findIndex((s) => s.id === selectedStep.id),
                          index
                        );
                      }}
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
                    >
                      Obtain
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-500 mt-2">
                Obtained from: {vc.obtainedFrom}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpatWallet;
