import React from "react";

interface EnvVariablesInputProps {
  variables: Array<{
    key: string;
    placeholder: string;
  }>;
  title: string;
}

export const EnvVariablesInput: React.FC<EnvVariablesInputProps> = ({
  variables,
  title,
}) => {
  return (
    <div className="border rounded-md p-4 mb-4">
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <div className="space-y-3">
        {variables.map((variable) => (
          <div key={variable.key} className="grid grid-cols-3 gap-2">
            <label className="font-medium text-sm self-center">
              {variable.key}
            </label>
            <input
              type="text"
              placeholder={variable.placeholder}
              className="col-span-2 p-2 border rounded-md"
            />
          </div>
        ))}
      </div>
      <button className="mt-4 bg-primary text-white px-4 py-2 rounded-md">
        Save Variables
      </button>
    </div>
  );
};
