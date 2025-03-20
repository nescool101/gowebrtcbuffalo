package actions

import "github.com/gobuffalo/buffalo"

// WebRTCIndex displays the WebRTC interface
func WebRTCIndex(c buffalo.Context) error {
	return c.Render(200, r.HTML("webrtc/index.plush.html"))
}
