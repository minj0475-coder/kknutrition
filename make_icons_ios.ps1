Add-Type -AssemblyName System.Drawing

function Make-RoundedIcon {
    param(
        [string]$source,
        [string]$dest,
        [int]$size,
        [int]$radius,
        [int]$borderWidth,
        [bool]$transparentBg
    )
    
    $img = [System.Drawing.Image]::FromFile((Resolve-Path $source).Path)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    if ($transparentBg) {
        $g.Clear([System.Drawing.Color]::Transparent)
    } else {
        $g.Clear([System.Drawing.Color]::FromArgb(255, 255, 250, 244)) # #fffaf4
    }
    
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    # Adjust for border drawing (draw inside)
    $inset = $borderWidth / 2.0
    $rectW = $size - $borderWidth
    $rectH = $size - $borderWidth
    
    $path.AddArc($inset, $inset, $d, $d, 180, 90)
    $path.AddArc($size - $inset - $d, $inset, $d, $d, 270, 90)
    $path.AddArc($size - $inset - $d, $size - $inset - $d, $d, $d, 0, 90)
    $path.AddArc($inset, $size - $inset - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    
    $g.SetClip($path)
    # If not transparent, we want to clear the clipped area with #fffaf4 too just in case? No, the original image already has #fffaf4 background
    $g.DrawImage($img, 0, 0, $size, $size)
    $g.ResetClip()
    
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 240, 222, 212), $borderWidth)
    $pen.Alignment = [System.Drawing.Drawing2D.PenAlignment]::Center
    $g.DrawPath($pen, $path)
    
    $bmp.Save((Resolve-Path ".").Path + "\" + $dest, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $pen.Dispose()
    $path.Dispose()
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
}

# The original images were overwritten by the transparent ones, but wait!
# If the original image was already replaced with the transparent one, drawing it over #fffaf4 will just restore the background!
Make-RoundedIcon -source "assets/app-icon-180.png" -dest "assets/app-icon-180-solid.png" -size 180 -radius 45 -borderWidth 4 -transparentBg $false

Write-Host "Done!"
