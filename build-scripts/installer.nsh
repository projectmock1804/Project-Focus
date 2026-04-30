; Custom NSIS script - runs before installing new files
; Deletes old app.asar so Electron doesn't load stale asar on upgrade
!macro customInstall
  Delete "$INSTDIR\resources\app.asar"
  RMDir /r "$INSTDIR\resources\app.asar.unpacked"
!macroend
