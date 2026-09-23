EXTENSION_NAME := gd-pattern-player
DIST_DIR := dist
STAGE_DIR := $(DIST_DIR)/$(EXTENSION_NAME)

CRX := $(DIST_DIR)/$(EXTENSION_NAME).crx
ZIP := $(DIST_DIR)/$(EXTENSION_NAME).zip

EXTENSION_FILES := manifest.json popup.html popup.js content.js gdr-parser.js

.PHONY: all build package clean

all: build

build: package

package:
	mkdir -p $(STAGE_DIR)
	rm -f $(CRX) $(ZIP)
	cp $(EXTENSION_FILES) $(STAGE_DIR)/
	zip -r $(ZIP) $(EXTENSION_FILES)
	crx3 -o $(CRX) $(STAGE_DIR)

clean:
	rm -rf $(DIST_DIR)
