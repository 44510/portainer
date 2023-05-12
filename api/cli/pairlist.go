package cli

import (
	portainer "github.com/portainer/portainer/api"

	"fmt"
	"strings"

	"gopkg.in/alecthomas/kingpin.v2"
)

type pairList portainer.MultiPair

// Set implementation for a list of portainer.Pair
func (l *pairList) Set(value string) error {
	parts := strings.SplitN(value, "=", 2)
	if len(parts) != 2 {
		return fmt.Errorf("expected NAME=VALUE got '%s'", value)
	}
	p := new(portainer.Pair)
	p.Name = parts[0]
	p.Value1 = parts[1]
	*l = append(*l, *p)
	return nil
}

// String implementation for a list of pair
func (l *pairList) String() string {
	return ""
}

// IsCumulative implementation for a list of pair
func (l *pairList) IsCumulative() bool {
	return true
}

func pairs(s kingpin.Settings) (target *portainer.MultiPair) {
	target = new(portainer.MultiPair)
	s.SetValue((*pairList)(target))
	return
}
