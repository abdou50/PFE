import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": "off",           // Désactive "variable non utilisée"
      "@typescript-eslint/no-explicit-any": "off",           // Désactive "no any"
      "react-hooks/exhaustive-deps": "warn",   
      "prefer-const": "off",
      "@next/next/no-img-element": "warn",                  // Add this for img element warnings
    },
  },
];

export default eslintConfig;
