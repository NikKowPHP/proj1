import React, { useState } from "react";

interface TopicFilterProps {
  onTopicsChange: (topics: string[]) => void;
}

const TopicFilter: React.FC<TopicFilterProps> = ({ onTopicsChange }) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Temporary topics - will be replaced with API data later
  const allTopics = [
    "Data Structures",
    "Algorithms",
    "System Design",
    "Behavioral",
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Database Design",
    "REST APIs",
  ];

  const filteredTopics = allTopics.filter((topic) =>
    topic.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleTopicChange = (topic: string) => {
    const newSelected = selectedTopics.includes(topic)
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];

    setSelectedTopics(newSelected);
    onTopicsChange(newSelected);
  };

  return (
    <div className="space-y-2">
      <div>
        <label
          htmlFor="topicSearch"
          className="block text-sm font-medium text-gray-700"
        >
          Filter Topics
        </label>
        <input
          type="text"
          id="topicSearch"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Search topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="max-h-48 overflow-y-auto border rounded-md p-2">
        {filteredTopics.map((topic) => (
          <div
            key={topic}
            className="flex items-center space-x-2 p-1 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              id={topic}
              checked={selectedTopics.includes(topic)}
              onChange={() => handleTopicChange(topic)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor={topic} className="text-sm text-gray-700">
              {topic}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicFilter;
