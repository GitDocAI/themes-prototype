package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Config struct {
	Port        string `json:"port"`
	DocsPath    string `json:"docs_path"`
	ConfigPath  string `json:"config_path"`
	AllowOrigin string `json:"allow_origin"`
}

type SaveContentRequest struct {
	Content string `json:"content"`
}

type UploadFileRequest struct {
	FilePath string `json:"file_path"` // Relative path where to save the file
	FileData string `json:"file_data"` // Base64 encoded file data
}

type RenameFileRequest struct {
	OldPath string `json:"old_path"` // Current file path (relative to docs path)
	NewPath string `json:"new_path"` // New file path (relative to docs path)
}

var config Config

func main() {
	// Load configuration
	if err := loadConfig(); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Setup routes
	mux := http.NewServeMux()

	// Documentation endpoints
	mux.HandleFunc("/api/docs/list", corsMiddleware(getDocListHandler))
	mux.HandleFunc("/api/docs/", corsMiddleware(docHandler))

	// Config endpoints
	mux.HandleFunc("/api/config", corsMiddleware(configHandler))

	// File upload endpoint
	mux.HandleFunc("/api/files/upload", corsMiddleware(uploadFileHandler))

	// File rename endpoint
	mux.HandleFunc("/api/files/rename", corsMiddleware(renameFileHandler))

	// Health check
	mux.HandleFunc("/api/health", corsMiddleware(healthHandler))

	// Start server
	addr := fmt.Sprintf(":%s", config.Port)
	log.Printf("🚀 Server starting on http://localhost%s", addr)
	log.Printf("📁 Docs path: %s", config.DocsPath)
	log.Printf("⚙️  Config path: %s", config.ConfigPath)
	log.Printf("🌐 CORS enabled for: %s", config.AllowOrigin)

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

func loadConfig() error {
	// Default configuration
	config = Config{
		Port:        getEnv("PORT", "8080"),
		DocsPath:    getEnv("DOCS_PATH", "../react-testing/public"),
		ConfigPath:  getEnv("CONFIG_PATH", "../react-testing/public/gitdocai.config.json"),
		AllowOrigin: getEnv("ALLOW_ORIGIN", "http://localhost:5173"),
	}

	// Resolve absolute paths
	var err error
	config.DocsPath, err = filepath.Abs(config.DocsPath)
	if err != nil {
		return fmt.Errorf("failed to resolve docs path: %w", err)
	}

	config.ConfigPath, err = filepath.Abs(config.ConfigPath)
	if err != nil {
		return fmt.Errorf("failed to resolve config path: %w", err)
	}

	// Verify paths exist
	if _, err := os.Stat(config.DocsPath); os.IsNotExist(err) {
		return fmt.Errorf("docs path does not exist: %s", config.DocsPath)
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// CORS middleware
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", config.AllowOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// Health check handler
func healthHandler(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status": "healthy",
		"time":   time.Now().Format(time.RFC3339),
		"config": map[string]string{
			"docs_path":   config.DocsPath,
			"config_path": config.ConfigPath,
		},
	}
	jsonResponse(w, http.StatusOK, response)
}

// Get documentation list handler
func getDocListHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	indexPath := filepath.Join(config.DocsPath, "index.json")
	data, err := os.ReadFile(indexPath)
	if err != nil {
		log.Printf("Error reading index.json: %v", err)
		http.Error(w, "Failed to read documentation list", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// Document handler (GET and PUT)
func docHandler(w http.ResponseWriter, r *http.Request) {
	// Extract docId from path: /api/docs/{docId}
	docId := strings.TrimPrefix(r.URL.Path, "/api/docs/")
	if docId == "" {
		http.Error(w, "Document ID is required", http.StatusBadRequest)
		return
	}

	// Sanitize docId to prevent directory traversal
	if strings.Contains(docId, "..") {
		http.Error(w, "Invalid document ID", http.StatusBadRequest)
		return
	}

	// Clean the path to remove any double slashes or other issues
	docId = filepath.Clean(docId)

	switch r.Method {
	case http.MethodGet:
		getDocumentHandler(w, r, docId)
	case http.MethodPut:
		saveDocumentHandler(w, r, docId)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// Get single document
func getDocumentHandler(w http.ResponseWriter, r *http.Request, docId string) {
	// Add .json extension if not present
	if !strings.HasSuffix(docId, ".json") {
		docId = docId + ".json"
	}
	docPath := filepath.Join(config.DocsPath, docId)

	data, err := os.ReadFile(docPath)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "Document not found", http.StatusNotFound)
		} else {
			log.Printf("Error reading document %s: %v", docId, err)
			http.Error(w, "Failed to read document", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// Save document
func saveDocumentHandler(w http.ResponseWriter, r *http.Request, docId string) {
	// Read request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var req SaveContentRequest
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "Invalid JSON in request body", http.StatusBadRequest)
		return
	}

	// Validate that content is valid JSON
	var contentData interface{}
	if err := json.Unmarshal([]byte(req.Content), &contentData); err != nil {
		http.Error(w, "Content must be valid JSON", http.StatusBadRequest)
		return
	}

	// Pretty print the JSON before saving
	prettyJSON, err := json.MarshalIndent(contentData, "", "  ")
	if err != nil {
		http.Error(w, "Failed to format JSON", http.StatusInternalServerError)
		return
	}

	// Add .json extension if not present
	if !strings.HasSuffix(docId, ".json") {
		docId = docId + ".json"
	}

	// Ensure directory exists
	docPath := filepath.Join(config.DocsPath, docId)
	docDir := filepath.Dir(docPath)
	if err := os.MkdirAll(docDir, 0755); err != nil {
		log.Printf("Error creating directory %s: %v", docDir, err)
		http.Error(w, "Failed to create directory", http.StatusInternalServerError)
		return
	}

	// Write the file
	if err := os.WriteFile(docPath, prettyJSON, 0644); err != nil {
		log.Printf("Error writing document %s: %v", docId, err)
		http.Error(w, "Failed to save document", http.StatusInternalServerError)
		return
	}

	log.Printf("✅ Successfully saved document: %s", docId)

	response := map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Document %s saved successfully", docId),
		"docId":   docId,
	}
	jsonResponse(w, http.StatusOK, response)
}

// Config handler (GET and PUT)
func configHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getConfigHandler(w, r)
	case http.MethodPut:
		saveConfigHandler(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// Get configuration
func getConfigHandler(w http.ResponseWriter, r *http.Request) {
	data, err := os.ReadFile(config.ConfigPath)
	if err != nil {
		log.Printf("Error reading config: %v", err)
		http.Error(w, "Failed to read configuration", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// Save configuration
func saveConfigHandler(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Validate JSON
	var configData interface{}
	if err := json.Unmarshal(body, &configData); err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	// Pretty print
	prettyJSON, err := json.MarshalIndent(configData, "", "  ")
	if err != nil {
		http.Error(w, "Failed to format JSON", http.StatusInternalServerError)
		return
	}

	// Ensure directory exists
	configDir := filepath.Dir(config.ConfigPath)
	if err := os.MkdirAll(configDir, 0755); err != nil {
		log.Printf("Error creating config directory %s: %v", configDir, err)
		http.Error(w, "Failed to create directory", http.StatusInternalServerError)
		return
	}

	if err := os.WriteFile(config.ConfigPath, prettyJSON, 0644); err != nil {
		log.Printf("Error writing config: %v", err)
		http.Error(w, "Failed to save configuration", http.StatusInternalServerError)
		return
	}

	log.Printf("✅ Successfully saved configuration")

	response := map[string]interface{}{
		"success": true,
		"message": "Configuration saved successfully",
	}
	jsonResponse(w, http.StatusOK, response)
}

// Upload file handler
func uploadFileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var req UploadFileRequest
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.FilePath == "" {
		http.Error(w, "file_path is required", http.StatusBadRequest)
		return
	}
	if req.FileData == "" {
		http.Error(w, "file_data is required", http.StatusBadRequest)
		return
	}

	// Sanitize file path to prevent directory traversal
	if strings.Contains(req.FilePath, "..") {
		http.Error(w, "Invalid file path", http.StatusBadRequest)
		return
	}

	// Clean the path
	cleanPath := filepath.Clean(req.FilePath)

	// Decode base64 data
	fileBytes, err := base64.StdEncoding.DecodeString(req.FileData)
	if err != nil {
		http.Error(w, "Invalid base64 data", http.StatusBadRequest)
		return
	}

	// Build full file path
	fullPath := filepath.Join(config.DocsPath, cleanPath)

	// Ensure directory exists
	fileDir := filepath.Dir(fullPath)
	if err := os.MkdirAll(fileDir, 0755); err != nil {
		log.Printf("Error creating directory %s: %v", fileDir, err)
		http.Error(w, "Failed to create directory", http.StatusInternalServerError)
		return
	}

	// Write file
	if err := os.WriteFile(fullPath, fileBytes, 0644); err != nil {
		log.Printf("Error writing file %s: %v", fullPath, err)
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	log.Printf("✅ Successfully uploaded file: %s", cleanPath)

	response := map[string]interface{}{
		"success":   true,
		"message":   "File uploaded successfully",
		"file_path": cleanPath,
	}
	jsonResponse(w, http.StatusOK, response)
}

// Rename file handler
func renameFileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var req RenameFileRequest
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.OldPath == "" {
		http.Error(w, "old_path is required", http.StatusBadRequest)
		return
	}
	if req.NewPath == "" {
		http.Error(w, "new_path is required", http.StatusBadRequest)
		return
	}

	// Sanitize paths to prevent directory traversal
	if strings.Contains(req.OldPath, "..") || strings.Contains(req.NewPath, "..") {
		http.Error(w, "Invalid file path", http.StatusBadRequest)
		return
	}

	// Clean the paths
	oldPath := filepath.Clean(req.OldPath)
	newPath := filepath.Clean(req.NewPath)

	// Add .json extension if not present
	if !strings.HasSuffix(oldPath, ".json") {
		oldPath = strings.TrimSuffix(oldPath, ".mdx") + ".json"
	}
	if !strings.HasSuffix(newPath, ".json") {
		newPath = strings.TrimSuffix(newPath, ".mdx") + ".json"
	}

	// Build full file paths
	fullOldPath := filepath.Join(config.DocsPath, oldPath)
	fullNewPath := filepath.Join(config.DocsPath, newPath)

	// Check if old file exists
	if _, err := os.Stat(fullOldPath); os.IsNotExist(err) {
		http.Error(w, fmt.Sprintf("File not found: %s", oldPath), http.StatusNotFound)
		return
	}

	// Check if new file already exists
	if _, err := os.Stat(fullNewPath); err == nil {
		http.Error(w, fmt.Sprintf("File already exists: %s", newPath), http.StatusConflict)
		return
	}

	// Ensure new directory exists
	newDir := filepath.Dir(fullNewPath)
	if err := os.MkdirAll(newDir, 0755); err != nil {
		log.Printf("Error creating directory %s: %v", newDir, err)
		http.Error(w, "Failed to create directory", http.StatusInternalServerError)
		return
	}

	// Rename/move the file
	if err := os.Rename(fullOldPath, fullNewPath); err != nil {
		log.Printf("Error renaming file from %s to %s: %v", fullOldPath, fullNewPath, err)
		http.Error(w, "Failed to rename file", http.StatusInternalServerError)
		return
	}

	log.Printf("✅ Successfully renamed file: %s -> %s", oldPath, newPath)

	response := map[string]interface{}{
		"success":  true,
		"message":  "File renamed successfully",
		"old_path": oldPath,
		"new_path": newPath,
	}
	jsonResponse(w, http.StatusOK, response)
}

// Helper: JSON response
func jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// Helper: Copy file
func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	return err
}
