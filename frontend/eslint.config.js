import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "src/api/schema.ts",
            "src/api/setupSchema.ts",
            "vite.config.ts",
            "eslint.config.js",
            "stylelint.config.js",
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    react.configs.flat.recommended,
    react.configs.flat["jsx-runtime"],
    jsxA11y.flatConfigs.recommended,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            "react-hooks": reactHooks,
            "simple-import-sort": simpleImportSort,
        },
        settings: {
            react: { version: "detect" },
        },
        rules: {
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "error",
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
            "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "separate-type-imports" }],
            "@typescript-eslint/no-magic-numbers": ["error", { ignore: [-1, 0, 1] }],
            curly: "error",
            eqeqeq: "error",
            "no-console": "error",
        },
    },
    {
        files: ["src/**"],
        ignores: ["src/messages/**"],
        rules: {
            "react/jsx-no-literals": [
                "error",
                {
                    noStrings: true,
                    ignoreProps: true,
                    allowedStrings: [
                        "›",
                        "‹",
                        "×",
                        "←",
                        "→",
                        "+",
                        "·",
                        "/",
                        "—",
                        "…",
                        "(",
                        ")",
                        "▲",
                        "▼",
                        "XM",
                        "IT",
                        "MOD",
                        "S3M",
                        "SampleRipper",
                        "AceMan",
                        "Fred / The Gang",
                    ],
                },
            ],
            "no-restricted-syntax": [
                "error",
                {
                    selector:
                        "JSXAttribute[name.name=/^(aria-label|aria-description|aria-roledescription|title|placeholder|alt)$/] > Literal[value=/\\S/]",
                    message: "User-visible text belongs in the message catalog: use text(M.…).",
                },
            ],
        },
    },
    {
        files: ["tests/**"],
        rules: {
            "@typescript-eslint/no-magic-numbers": "off",
        },
    },
);
