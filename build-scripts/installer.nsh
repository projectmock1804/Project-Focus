; Custom NSIS script for Project Focus
; - Kill running processes BEFORE install (preInit runs before file extraction)
; - Clean up obsolete asar artifacts AFTER install (customInstall)

!macro preInit
  ; Kill all running Project Focus instances so install can overwrite locked files
  nsExec::Exec 'taskkill /F /IM "Project Focus.exe" /T'
  Sleep 1000
!macroend

!macro customInstall
  ; Clean up old asar artifacts from pre-1.0.5 versions
  ; (Safe: current builds don't use asar so these files only exist from old installs)
  Delete "$INSTDIR\resources\app.asar"
  RMDir /r "$INSTDIR\resources\app.asar.unpacked"
!macroend

!macro customUnInstall
  ; Kill any running instances before uninstall so files can be deleted
  nsExec::Exec 'taskkill /F /IM "Project Focus.exe" /T'
  Sleep 500
!macroend
