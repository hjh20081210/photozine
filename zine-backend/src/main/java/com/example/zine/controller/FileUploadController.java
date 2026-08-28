package com.example.zine.controller;

import com.example.zine.common.Result;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/file")
public class FileUploadController {

    @Value("${upload.path}")
    private String uploadPath;

    @PostMapping("/upload")
    public Result<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Result.fail("文件不能为空");
        }

        // 校验文件类型
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return Result.fail("只允许上传图片");
        }

        // 生成唯一文件名
        String originalFilename = file.getOriginalFilename();
        String suffix = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            suffix = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString().replace("-", "") + suffix;

        // 保存文件
        File targetDir = new File(uploadPath);
        if (!targetDir.exists()) {
            targetDir.mkdirs();
        }
        File destFile = new File(targetDir, fileName);

        try {
            file.transferTo(destFile);
        } catch (IOException e) {
            e.printStackTrace();
            return Result.fail("文件保存失败");
        }

        // 返回访问路径
        Map<String, String> data = new HashMap<>();
        data.put("url", "/upload/" + fileName);
        data.put("fileName", fileName);

        return Result.success(data);
    }
}