import React from "react";

const Dashboard = () => {
  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Superpod</h1>
          <div className="w-8 h-8 bg-gray-300 rounded-full" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-4 flex-1 mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded h-32" />
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center space-x-2">
          <button className="p-2 bg-blue-500 text-white rounded">▶</button>
          <input
            type="text"
            placeholder="Type a message"
            className="flex-1 p-2 border rounded"
          />
          <button className="p-2 bg-green-500 text-white rounded">➤</button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-64 p-4 bg-gray-100 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-12 bg-white rounded" />
          <div className="h-12 bg-white rounded" />
          <div className="h-12 bg-white rounded" />
        </div>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search"
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
