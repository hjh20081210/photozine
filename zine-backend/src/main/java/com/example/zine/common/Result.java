package com.example.zine.common;

public class Result<T> {
    private Integer code;
    private String msg;
    private T data;

    public static <T> Result<T> success(T data) {
        Result<T> r = new Result<>();
        r.code = 200;
        r.msg = "ok";
        r.data = data;
        return r;
    }

    public static <T> Result<T> fail(String msg) {
        Result<T> r = new Result<>();
        r.code = 500;
        r.msg = msg;
        return r;
    }

    public Integer getCode() { return code; }
    public String getMsg() { return msg; }
    public T getData() { return data; }
    public void setCode(Integer code) { this.code = code; }
    public void setMsg(String msg) { this.msg = msg; }
    public void setData(T data) { this.data = data; }
}