EXTENSION_NAME := gd-pattern-player
DIST_DIR := dist
ZIP := $(DIST_DIR)/$(EXTENSION_NAME).zip

EXTENSION_FILES := 	manifest.json 	popup.html 	popup.js 	content.js 	gdr-parser.js

.PHONY: all build package clean

all: build

build: package

package:
	mkdir -p $(DIST_DIR)
	rm -f $(ZIP)
	zip -r $(ZIP) $(EXTENSION_FILES)

clean:
	rm -rf $(DIST_DIR)
