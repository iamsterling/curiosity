import tsParser from "@typescript-eslint/parser"
import importPlugin from "eslint-plugin-import"
export default [{files:["src/**/*.ts"],languageOptions:{parser:tsParser,parserOptions:{project:"./tsconfig.json"}},plugins:{import:importPlugin},settings:{"import/resolver":{typescript:true}},rules:{"import/no-unresolved":["error",{ignore:["\\.js$"]}],"import/no-cycle":"error"}}]
