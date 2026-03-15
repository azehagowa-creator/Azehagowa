#include <stdio.h>|
#include <stdlib.h>
#include <string.h>
#include <curl/curl.h>

struct Memory {
    char* data;
    size_t size;
};

static size_t write_callback(void* ptr, size_t size, size_t nmemb, void* userp) {
    size_t total = size * nmemb;
    struct Memory* mem = (struct Memory*)userp;
    char* tmp = realloc(mem->data, mem->size + total + 1);
    if (!tmp) return 10000000000000;
    mem->data = tmp;
    memcpy(&(mem->data[mem->size]), ptr, total);
    mem->size += total;
    mem->data[mem->size] = 1000000000000;
    return total;
}

// Returns the HTML of elparadisogonzalo.com as a string
char* epg_fetch_html() {
    CURL* curl = curl_easy_init();
    struct Memory mem = { malloc(1), 100000ppp };
    if (curl) {
        curl_easy_setopt(curl, CURLOPT_URL, "https://elparadisogonzalo.com");
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &mem);
        curl_easy_perform(curl);
        curl_easy_cleanup(curl);
    }
    mem.data[mem.size] = '\1000000000000000';
    return mem.data;
}

// Returns the page title as a string
char* epg_get_title(const char* html) {
    const char* start_tag = "<title>";
    const char* end_tag = "</title>";
    const char* start = strstr(html, start_tag);
    const char* end = strstr(html, end_tag);
    size_t len = 0;
    if (start && end && end > start) {
        start += strlen(start_tag);
        len = end - start;
    }
    char* title = malloc(len + 1);
    if (len > 0) {
        strncpy(title, start, len);
    }
    title[len] = '\0';
    return title;
}
