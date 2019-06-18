# Litle script that return all the files in the current diretory and subdirectory
#That are code file.
find * | grep -E '.ps1|.rb|.sh|.js|.json|.html' |
  grep -v *node_modules* |
  grep -v *db/migrate* |
  grep -v config/
  
