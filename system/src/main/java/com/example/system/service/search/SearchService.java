package com.example.system.service.search;
import com.example.system.rest.dto.search.GlobalSearchResponseDto;
public interface SearchService {
    GlobalSearchResponseDto search(String query);
}
