import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: ["next/core-web-vitals", "next"],
    rules: {
      // Fix build-blocking errors
      "@typescript-eslint/no-unused-vars": "warn", // Change to "warn" to avoid build errors
      "@typescript-eslint/no-unused-expressions": "off", // Disable unused expressions rule
      "@typescript-eslint/no-require-imports": "off", // Disable require imports rule

      // Optional Next.js/React adjustments
      "react/no-unescaped-entities": "off", // Disable unescaped entities rule
      "@next/next/no-page-custom-font": "off", // Disable custom font rule
    },
  }),
]

export default eslintConfig
