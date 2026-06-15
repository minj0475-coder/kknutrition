Add-Type -AssemblyName System.Drawing

function Make-RoundedIcon {
    param(
        [string]$source,
        [string]$dest,
        [int]$size,
        [int]$radius,
        [int]$borderWidth
    )
    
    $img = [System.Drawing.Image]::FromFile((Resolve-Path $source).Path)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)
    
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

Make-RoundedIcon -source "assets/app-icon-512.png" -dest "assets/app-icon-512-rounded.png" -size 512 -radius 130 -borderWidth 12
Make-RoundedIcon -source "assets/app-icon-192.png" -dest "assets/app-icon-192-rounded.png" -size 192 -radius 48 -borderWidth 5
Make-RoundedIcon -source "assets/app-icon-180.png" -dest "assets/app-icon-180-rounded.png" -size 180 -radius 45 -borderWidth 4

Write-Host "Done!"
